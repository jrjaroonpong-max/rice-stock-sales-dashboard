import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const auth = await supabaseServer();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    const { data: profile } = await auth.from("user_profiles").select("role,store_code").eq("id", user.id).maybeSingle();
    if (!profile || !["admin","store_manager"].includes(profile.role)) return NextResponse.json({ error: "ไม่มีสิทธิ์อัปโหลดข้อมูล" }, { status: 403 });
    const form = await req.formData(); const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const book = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = book.Sheets["Product List"] || book.Sheets[book.SheetNames[0]];
    if (!sheet) return NextResponse.json({ error: "ไม่พบ Sheet ข้อมูลสินค้า" }, { status: 400 });
    const raw = XLSX.utils.sheet_to_json<any>(sheet, { defval: null, range: 3 });
    const rows = raw.filter(r => r["Item No"] !== null && r["Item No"] !== undefined);
    if (!rows.length) return NextResponse.json({ error: "ไม่พบข้อมูล Item No ในไฟล์" }, { status: 400 });
    let snapshotDate = new Date().toISOString().slice(0,10);
    const dashboardSheet = book.Sheets["Dashboard"];
    const dateLabel = dashboardSheet ? String(dashboardSheet["A2"]?.v || "") : "";
    const dateMatch = dateLabel.match(/DATA AS OF\\s+(\\d{1,2}\\s+[A-Z]{3}\\s+\\d{4})/i);
    if (dateMatch) {
      const parsed = new Date(dateMatch[1]);
      if (!Number.isNaN(parsed.getTime())) snapshotDate = parsed.toISOString().slice(0,10);
    }
    const toNum = (v:any) => { const n=Number(v ?? 0); if(!Number.isFinite(n)) throw new Error("พบค่าตัวเลขไม่ถูกต้อง"); return n; };
    const records = rows.map((r:any) => {
      const item = String(r["Item No"]).trim();
      if (!item) throw new Error("พบ Item No ว่าง");
      const asoh=toNum(r["ASOH"]), avg=toNum(r["Avg Sale 28 Days"]);
      const cover=avg>0?Math.max(0,asoh)/avg:(asoh>0?999:0);
      const status=asoh<=0?"CRITICAL":cover<3?"HIGH":cover<7?"WARNING":"HEALTHY";
      return {
        store_code: String(profile.store_code || "29"),
        snapshot_date: snapshotDate,
        item_no: item,
        description: String(r["Description"]||""),
        selling_price: toNum(r["Selling Price"]),
        asoh, usoh:toNum(r["USOH"]), on_order:toNum(r["On Order"]), in_transit:toNum(r["In Transit"]),
        avg_sale_28d:avg, last_month_sold:toNum(r["Last Month Sold Qty"]),
        current_month_sold:toNum(r["Curr Month Sold Qty"]), ly_same_period_sold:toNum(r["LY This Month Sold Qty"]),
        stock_cover_days:cover, oos_status:status, stock_value:asoh*toNum(r["Selling Price"]),
        uploaded_by:user.id
      };
    });
    const seen=new Set<string>(); for(const r of records){if(seen.has(r.item_no))throw new Error(`Item No ซ้ำในไฟล์: ${r.item_no}`);seen.add(r.item_no);}
    const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await service.from("inventory_snapshots").upsert(records,{onConflict:"store_code,snapshot_date,item_no"});
    if(error) throw error;
    await service.from("upload_logs").insert({store_code:profile.store_code||"29",snapshot_date:snapshotDate,file_name:file.name,record_count:records.length,uploaded_by:user.id,status:"completed"});
    return NextResponse.json({ imported: records.length, snapshot_date: snapshotDate });
  } catch (e:any) { return NextResponse.json({ error: e.message || "เกิดข้อผิดพลาดในการนำเข้า" }, { status: 400 }); }
}

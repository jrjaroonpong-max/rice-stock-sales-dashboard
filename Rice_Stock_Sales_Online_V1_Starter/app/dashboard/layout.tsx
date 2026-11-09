import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
export default async function DashboardLayout({children}:{children:React.ReactNode}){
 const supabase=await supabaseServer(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
 const {data:profile}=await supabase.from("user_profiles").select("display_name,role,store_code").eq("id",user.id).maybeSingle();
 return <div className="shell"><aside className="side"><div className="brand">RICE STOCK<br/> & SALES</div><div className="mutedLight">STORE 29 • TRANG</div><nav className="nav"><Link href="/dashboard">01 Overview</Link><Link href="/dashboard/oos">02 OOS Control</Link><Link href="/dashboard/aging">03 Aging Control</Link><Link href="/dashboard/opportunity">04 Sales Opportunity</Link><Link href="/dashboard/upload">05 Upload & Actions</Link></nav><div style={{marginTop:36,fontSize:12,color:"#b8c9dc"}}>{profile?.display_name||user.email}<br/>Role: {profile?.role||"pending"}<br/>Store: {profile?.store_code||"29"}</div></aside><main className="main">{children}</main></div>
}

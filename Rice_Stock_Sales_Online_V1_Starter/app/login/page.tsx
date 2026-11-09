"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
export default function Login(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{const {error}=await supabaseBrowser().auth.signInWithPassword({email,password});if(error)throw error;router.push("/dashboard");router.refresh();}catch(err:any){setError(err.message||"เข้าสู่ระบบไม่สำเร็จ");}finally{setBusy(false);}}
 return <main className="login card"><div className="eyebrow">STORE 29 TRANG</div><h1 className="h1">Rice Stock & Sales</h1><p className="small">เข้าสู่ระบบเพื่อบริหารสต็อกและยอดขายข้าวสาร</p><form onSubmit={submit}><label className="label">อีเมล</label><input className="field" type="email" required value={email} onChange={e=>setEmail(e.target.value)} style={{margin:"6px 0 14px"}}/><label className="label">รหัสผ่าน</label><input className="field" type="password" required value={password} onChange={e=>setPassword(e.target.value)} style={{margin:"6px 0 18px"}}/><button className="btn" disabled={busy} style={{width:"100%"}}>{busy?"กำลังเข้าสู่ระบบ...":"Login"}</button>{error&&<p className="error">{error}</p>}</form><p className="small" style={{marginTop:18}}>ผู้ดูแลระบบต้องสร้างผู้ใช้และกำหนด Role ใน Supabase ก่อนใช้งาน</p></main>
}

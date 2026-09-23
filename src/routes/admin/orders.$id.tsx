import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const API_BASE = "/api/admin";
const ALL_STATUSES = ["pending","paid","preparing","shipped","delivered","cancelled"];
const STATUS_LABELS: Record<string,string> = {pending:"Sipariş alındı",paid:"Ödeme onaylandı",preparing:"Ürün hazırlanıyor",shipped:"Kargoya verildi",delivered:"Teslim edildi",cancelled:"İptal edildi"};
const STATUS_COLORS: Record<string,string> = {pending:"bg-yellow-500/20 text-yellow-400",paid:"bg-green-500/20 text-green-400",preparing:"bg-blue-500/20 text-blue-400",shipped:"bg-cyan/20 text-cyan",delivered:"bg-emerald-500/20 text-emerald-400",cancelled:"bg-crim/20 text-crim"};
function getToken(){try{return localStorage.getItem("admin-token")??""}catch{return""}}

export const Route=createFileRoute("/admin/orders/$id")({
  head:()=>({meta:[{title:"Sipariş Detay — Admin"},{name:"robots",content:"noindex,nofollow"}]}),
  component:OrderDetailPage,
});

function OrderDetailPage(){
  const{id}=Route.useParams();const router=useRouter();
  const[order,setOrder]=useState<any>(null);
  const loadOrder=async()=>{const token=getToken();const orders=await(await fetch(`${API_GW}/api/admin/orders?t=${token}`)).json();setOrder(orders.find((x:any)=>x.id===id)??null)};
  useEffect(()=>{loadOrder()},[id]);

  const handleStatus=async(status:string)=>{const token=getToken();await fetch(`${API_GW}/api/orders/${id}`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({status})});loadOrder()};

  if(!order)return<div className="flex min-h-screen items-center justify-center bg-ink text-paper"><p className="text-paper/50">Yükleniyor...</p></div>;
  const statusHistory:{status:string;date:string}[]=order.statusHistory??[];

  return(<div className="min-h-screen bg-ink text-paper">
    <header className="flex items-center justify-between border-b border-paper/15 px-6 py-4 lg:px-10"><div className="flex items-center gap-3"><span className="size-2.5 rounded-full bg-crim"/><span className="font-display text-lg tracking-wide">Sipariş Detay</span></div><button onClick={()=>router.navigate({to:"/admin/dashboard"})} className="text-[11px] uppercase tracking-[0.18em] text-paper/50 transition hover:text-paper">← Geri</button></header>
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
      <div className="mb-8 rounded-lg border border-paper/15 p-5">
        <h2 className="mb-4 font-display text-base uppercase">Sipariş Durumu</h2>
        <div className="relative pl-8"><div className="absolute left-3.5 top-2 h-[calc(100%-1rem)] w-0.5 bg-paper/15"/>
          {ALL_STATUSES.filter(s=>s!=="cancelled").map(status=>{
            const isActive=statusHistory.some(h=>h.status===status);const hEntry=statusHistory.find(h=>h.status===status);const isCurrent=order.status===status;
            return(<div key={status} className={`relative mb-5 last:mb-0 ${!isActive&&!isCurrent?"opacity-30":""}`}>
              <div className={`absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 ${isActive?"border-crim bg-crim/10":isCurrent?"border-yellow-500 bg-yellow-500/10":"border-paper/30 bg-ink"} ${isCurrent?"ring-2 ring-crim/30 ring-offset-2 ring-offset-ink":""}`}><span className="text-xs">{isActive?"✓":""}</span></div>
              <div className="ml-2"><p className="text-sm font-display uppercase">{STATUS_LABELS[status]}</p>{hEntry&&<p className="text-[10px] text-paper/40">{new Date(hEntry.date).toLocaleString("tr-TR")}</p>}{isCurrent&&<span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase ${STATUS_COLORS[status]}`}>Aktif</span>}</div>
            </div>)
          })}
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-paper/15 p-5"><h2 className="mb-3 font-display text-base uppercase">Müşteri Bilgileri</h2><div className="space-y-1 text-sm"><p><span className="text-paper/50">Ad:</span>{order.customerName}</p><p><span className="text-paper/50">E-posta:</span>{order.customerEmail}</p><p><span className="text-paper/50">Telefon:</span>{order.customerPhone}</p><p><span className="text-paper/50">Adres:</span>{order.customerAddress}</p>{order.note&&<p><span className="text-paper/50">Not:</span>{order.note}</p>}</div></div>

      <div className="mb-6 rounded-lg border border-paper/15 p-5"><h2 className="mb-3 font-display text-base uppercase">Ürünler</h2><table className="w-full text-left text-sm"><thead><tr className="border-b border-paper/15 text-[11px] uppercase tracking-[0.18em] text-paper/50"><th className="pb-2 pr-4">Ürün</th><th className="pb-2 pr-4">Beden</th><th className="pb-2 pr-4">Renk</th><th className="pb-2 pr-4">Adet</th><th className="pb-2">Tutar</th></tr></thead><tbody>{(order.items??[]).map((item:any,i:number)=>(<tr key={i} className="border-b border-paper/10"><td className="py-2 pr-4 font-display uppercase">{item.name}</td><td className="py-2 pr-4 text-paper/60">{item.size}</td><td className="py-2 pr-4 text-paper/60">{item.color}</td><td className="py-2 pr-4">{item.qty}</td><td className="py-2 text-cyan">₺{item.price*item.qty}</td></tr>))}</tbody><tfoot><tr><td colSpan={4} className="py-3 text-right font-display text-sm uppercase">Toplam</td><td className="py-3 font-display text-lg text-cyan">₺{order.total}</td></tr></tfoot></table></div>

      <div className="mb-6 rounded-lg border border-paper/15 p-5"><h2 className="mb-3 font-display text-base uppercase">Ödeme</h2><p className="text-sm"><span className="text-paper/50">Ödeme ID:</span>{order.paymentId??<span className="text-paper/40">—</span>}</p><p className="mt-1 text-sm"><span className="text-paper/50">Tarih:</span>{new Date(order.createdAt).toLocaleString("tr-TR")}</p></div>

      {order.status!=="cancelled"&&order.status!=="delivered"&&(<div className="flex flex-wrap gap-3">
        {order.status==="pending"&&<><button onClick={()=>handleStatus("paid")} className="rounded-full bg-green-600 px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-white transition hover:bg-green-500">Ödendi olarak işaretle</button><button onClick={()=>handleStatus("cancelled")} className="rounded-full border border-crim/50 px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-crim transition hover:bg-crim hover:text-ink">İptal et</button></>}
        {order.status==="paid"&&<button onClick={()=>handleStatus("preparing")} className="rounded-full bg-blue-600 px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-white transition hover:bg-blue-500">Hazırlanıyor olarak işaretle</button>}
        {order.status==="preparing"&&<button onClick={()=>handleStatus("shipped")} className="rounded-full bg-cyan px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ink transition hover:bg-cyan/80">Kargoya verildi olarak işaretle</button>}
        {order.status==="shipped"&&<button onClick={()=>handleStatus("delivered")} className="rounded-full bg-emerald-600 px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-white transition hover:bg-emerald-500">Teslim edildi olarak işaretle</button>}
      </div>)}
    </div></div>);
}

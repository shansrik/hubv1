"use strict";(()=>{var e={};e.id=963,e.ids=[963],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3388:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>g,patchFetch:()=>h,requestAsyncStorage:()=>l,routeModule:()=>d,serverHooks:()=>f,staticGenerationAsyncStorage:()=>c});var a={};n.r(a),n.d(a,{POST:()=>u});var r=n(3278),o=n(5002),i=n(4877),s=n(1309);async function p(e){let t=e.getReader(),n=[];for(;;){let{done:e,value:a}=await t.read();if(e)break;n.push(a)}return Buffer.concat(n)}async function u(e){try{let t=await e.formData(),n=t.get("html"),a=t.get("filename")||"document.pdf",r="true"===t.get("isMultiPage");if(!n)return new s.NextResponse(JSON.stringify({error:"HTML content is required"}),{status:400,headers:{"Content-Type":"application/json"}});let o=await fetch("https://api.pdfshift.io/v3/convert/pdf",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Basic ${Buffer.from(process.env.PDFSHIFT_API_KEY||"").toString("base64")}`},body:JSON.stringify({source:n,landscape:!1,format:"Letter",margin:r?"0":"0.5in",sandbox:!1,pdf_options:{preferCSSPageSize:!0,printBackground:!0}})});if(!o.ok){console.warn("PDF service unavailable, using fallback PDF generation");let e=r?"PDF service unavailable. Your multi-page document could not be generated.":"PDF service unavailable. Please try again later.",t=Buffer.from(`
        %PDF-1.4
        1 0 obj
        << /Type /Catalog
           /Pages 2 0 R
        >>
        endobj
        2 0 obj
        << /Type /Pages
           /Kids [3 0 R]
           /Count 1
        >>
        endobj
        3 0 obj
        << /Type /Page
           /Parent 2 0 R
           /Resources << /Font << /F1 4 0 R >> >>
           /MediaBox [0 0 612 792]
           /Contents 5 0 R
        >>
        endobj
        4 0 obj
        << /Type /Font
           /Subtype /Type1
           /BaseFont /Helvetica
        >>
        endobj
        5 0 obj
        << /Length ${2*e.length} >>
        stream
        BT
        /F1 12 Tf
        50 700 Td
        (${e}) Tj
        ET
        endstream
        endobj
        xref
        0 6
        0000000000 65535 f
        0000000009 00000 n
        0000000058 00000 n
        0000000119 00000 n
        0000000247 00000 n
        0000000320 00000 n
        trailer
        << /Size 6
           /Root 1 0 R
        >>
        startxref
        439
        %%EOF
      `);return new s.NextResponse(t,{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${a}"`}})}let i=o.body;if(!i)return new s.NextResponse(JSON.stringify({error:"Failed to generate PDF"}),{status:500,headers:{"Content-Type":"application/json"}});let u=await p(i);return new s.NextResponse(u,{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${a}"`}})}catch(e){return console.error("PDF generation error:",e),new s.NextResponse(JSON.stringify({error:"Failed to generate PDF",details:e.message}),{status:500,headers:{"Content-Type":"application/json"}})}}let d=new r.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/generate-pdf/route",pathname:"/api/generate-pdf",filename:"route",bundlePath:"app/api/generate-pdf/route"},resolvedPagePath:"/Users/shansrikanthan/Documents/GitHub/hubv1/app/api/generate-pdf/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:l,staticGenerationAsyncStorage:c,serverHooks:f}=d,g="/api/generate-pdf/route";function h(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:c})}}};var t=require("../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),a=t.X(0,[379,833],()=>n(3388));module.exports=a})();
// أدوات تصدير مشتركة — CSV (UTF-8 آمن للعربية) + طباعة/حفظ PDF عبر المتصفح

const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export function downloadCSV(filename, headers, rows) {
  const lines = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))];
  // BOM يضمن قراءة Excel للعربية بشكل صحيح
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

const cell = (v) => `<td>${v === null || v === undefined ? '' : String(v)}</td>`;

// يبني جدول HTML للطباعة
export function tableHTML(headers, rows) {
  return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`
    + `<tbody>${rows.map(r => `<tr>${r.map(cell).join('')}</tr>`).join('')}</tbody></table>`;
}

// يفتح نافذة طباعة (المستخدم يختار "حفظ كـ PDF")
export function printReport({ title, subtitle = '', dir = 'rtl', sections = [] }) {
  const w = window.open('', '_blank');
  if (!w) { alert('يرجى السماح بالنوافذ المنبثقة للطباعة'); return; }
  const body = sections.map(s => `${s.heading ? `<h2>${s.heading}</h2>` : ''}${s.html}`).join('');
  w.document.write(`<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><title>${title}</title>
    <style>
      *{box-sizing:border-box} body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;padding:28px;color:#1e293b;margin:0}
      .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #4F46E5;padding-bottom:12px;margin-bottom:18px}
      .brand{color:#4F46E5;font-weight:800;font-size:22px;letter-spacing:1px}
      h1{font-size:18px;margin:0} .sub{color:#64748b;font-size:12px;margin-top:4px}
      h2{font-size:14px;margin:18px 0 8px;color:#334155}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}
      th,td{padding:7px 10px;border-bottom:1px solid #e5e7ef;text-align:${dir === 'rtl' ? 'right' : 'left'}}
      th{background:#f8fafc;color:#475569;font-weight:700}
      .stamp{color:#94a3b8;font-size:11px;margin-top:16px}
      @media print{body{padding:0}}
    </style></head><body>
    <div class="head"><div><h1>${title}</h1><div class="sub">${subtitle}</div></div><div class="brand">FLOWRIZ</div></div>
    ${body}
    <div class="stamp">${new Date().toLocaleString(dir === 'rtl' ? 'ar' : 'en')}</div>
    <script>window.onload=function(){setTimeout(function(){window.print();},250);}</script>
    </body></html>`);
  w.document.close();
}

// Cloudinary unsigned upload (public-safe: cloud name + unsigned preset only)
export const CLOUDINARY = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD || 'dot2kbpgr',
  preset:    process.env.REACT_APP_CLOUDINARY_PRESET || 'flowriz_docs',
};

export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY.preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/auto/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) {
    let msg = 'فشل رفع الملف';
    try { msg = (await res.json()).error?.message || msg; } catch (e) {}
    throw new Error(msg);
  }
  const data = await res.json();
  return { url: data.secure_url, name: file.name, format: data.format || '', bytes: data.bytes || 0 };
}

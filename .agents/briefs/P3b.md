# P3b — Vụ nổ hoả liên: quả cầu lửa thật, mây nấm phát sáng (vòng ngắn)

Phạm vi hẹp: chỉ `src/fx/ultimate/hoa-lien-burst.js`. Không sửa `_lotus-lib.js` (việc khác đang sửa song song), không sửa file khác.
Giữ `export const BREAK` và `meta.duration` gần như cũ (move đang dùng); nếu buộc phải đổi, ghi rõ trong report.

## Vấn đề (Opus xem `records/ultimate/phat-no-hoa-lien/contact.png`, khung ~59–110)
1. Quả cầu lửa là **các dải màu xoắn như kẹo mút / bánh xe sặc sỡ** với các bong bóng tròn — đồ hoạ, không phải lửa.
2. Mây nấm xám đục chiếm khung quá lâu (≈2.3–4.6 s), **mất hết màu lửa**.
3. Vòng xung kích mảnh, yếu so với `explosions/nuke`.

## Cần
- Cầu lửa = **nhiều luồng lửa thật** (P.FIRE, PF.BIG, Plume/Column của `explosions/_lib.js`) mỗi luồng một sắc, cuộn xoáy vào nhau
  nhưng **giữ dải màu riêng**, lõi trắng chói lúc đầu, cháy nguội dần thành khói. Bỏ bong bóng tròn và dải kẹo.
- Mây nấm: **phát sáng từ trong** bằng màu lửa (light buffer + đáy mây ửng màu), xám tối chỉ ở đỉnh, tan nhanh hơn (~1.3 s
  sau khi thành hình).
- Vòng xung kích: dày, sáng mép trước, viền **răng cưa như cánh sen**, 2 vòng lệch nhịp, nửa xa/nửa gần (`band`).
- Lúc vỡ cân bằng: cánh sen bung ra thành **8–12 cánh lửa bay tung** theo hướng toả, rồi rơi lả tả.

## Quy trình
`node tools/render.mjs ultimate/hoa-lien-burst` → nhìn → sửa, 2–3 vòng; benchmark cạnh `explosions/nuke`, `explosions/big-explosion`.
Xong: `node tools/check.mjs ultimate/hoa-lien-burst` sạch. Không xuất sheet/gif. Ghi ≤ 120 từ vào report.

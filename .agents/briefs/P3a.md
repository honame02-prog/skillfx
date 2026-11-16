# P3a — Cánh sen phải là LỬA, không phải pha lê (vòng ngắn)

Phạm vi hẹp: chỉ `src/fx/ultimate/_lotus-lib.js` (hàm `petal`, `lotus`, `wheel`, `orbitEmbers`) và `src/fx/ultimate/hoa-lien.js`.
Không đổi chữ ký hàm đã export (burst và move đang gọi chúng). Không sửa file khác.

## Vấn đề (Opus xem `records/ultimate/hoa-lien/contact.png`)
Đoá sen đọc rõ là hoa sen và 4 sắc tách bạch — giữ. Nhưng cánh là khối đặc mặt cắt cứng, trông như **pha lê/đá quý**.

## Cần
- Mỗi cánh là **ngọn lửa hình cánh sen**: thân lửa trong mờ dần về mép (dùng `p.disc`/`p.blend` hoặc cắt ngưỡng noise chạy lên),
  **mép trên rách và liếm lên** (lưỡi lửa tách ra, bay lên tắt), lõi cánh sáng (light buffer), gốc cánh đậm.
  Ánh sáng gánh độ sáng (bar #1), không tô mảng bão hoà. Bỏ đường gờ mặt cắt kiểu tinh thể.
- Lưỡi lửa nhỏ (P.FIRE/EMBER của từng sắc) bốc lên từ đầu cánh, nhịp lệch nhau.
- Nhụy: lõi trắng nhỏ + glow, tia sáng mảnh.
- Giữ silhouette hoa sen đọc được ở 1x, giữ loop liền mạch, giữ 2/3/4 sắc.

## Quy trình
`node tools/render.mjs ultimate/hoa-lien --zoom 4` → nhìn → sửa, 2–3 vòng. Benchmark cạnh `fire/` đẹp nhất (torch, bonfire…).
Xong: `node tools/check.mjs ultimate/hoa-lien` sạch. Không xuất sheet/gif. Ghi ≤ 120 từ vào report.

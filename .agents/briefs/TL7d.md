goal: Sửa PHẦN KẾT trong `src/fx/di-hoa/_tinhlien-end.js` (chấm: ĐƠN GIẢN HOÁ, P1).
lỗi đã chấm: 4.90 sen lớn hơn nhưng viền như khung dây (chỉ nét, không có lòng sáng); 5.50 cột xoáy dày hơn nhưng mất các vòng sáng của v4. Tro và dấu sen cháy 6.30 giàu hơn — giữ.
sửa:
1. lightLotus 3.8–4.8: lòng cánh được rọi sáng L[3..5] (cộng sáng p.shade o.l/o.k, đậm ở gốc cánh, nhạt ra đầu cánh) + viền liền L[5..6] dày 1–2 px; bụi quanh sen sáng lên theo (quầng). Không còn cảm giác khung dây.
2. column 4.75–5.8: quấn 2–3 VÒNG SÁNG xoắn quanh cột bụi (dải L[3..6] chạy xoắn lên, như v4 nhưng nhiều hơn), giữ độ dày mới; tàn lửa trắng-vàng bị cuốn.
3. gulp 5.72–5.9: chớp L[3..6] ngang mắt 2–3 khung, đủ rộng bằng mắt.
write_scope: src/fx/di-hoa/_tinhlien-end.js
done_when: gate PASS với mốc trong TL7-common; ending() p95 ≤ 5 ms; strip không ô nào nghèo hơn v4.png ở phần kết. Khung END vẫn trống.
Đọc: .agents/briefs/TL7-common.md, TL6-common.md, TL6d.md.

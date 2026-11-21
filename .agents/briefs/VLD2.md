# VLD2 — Vẫn Lạc td: chi tiết NỔ TOẢ + TÀN (2,40–3,00 s)

Người dùng đã DUYỆT HƯỚNG nháp v3b (21/11). Việc này chỉ làm CHI TIẾT pha nổ/tàn, không đổi nhịp, không đổi hoả xà.
Kịch bản + bảng tiêu chí: ../design/tienson/08-van-lac-topdown.md (đọc hết: dòng 2,40 và 2,40–3,00, bảng K1–K15). Ảnh nháp đã duyệt: ../deliver/tienson/08-van-lac-td-v3b-review.png (ô 2.6, 2.9).

## Hiện trạng
src/fx/di-hoa/_vanlac-td-burst.js: burst(p, t, part) — chớp ngực, vòng xung kích sàn, vòng trên không, 16 lưỡi lửa toả 3D, 40 tàn, tro, 2 hồn xà chữ V, đốm tim tắt cuối. Painter gương (chỉ nửa phải được giữ). Hoả xà hồn dùng drawSerpentTD của src/fx/di-hoa/_serpent-td-lib.js (đã duyệt, chỉ gọi, không sửa).
Lời chê (scout): 16 lưỡi lửa ở 2,6 là "gai trắng-hồng nhọn toả đều", không ra lửa.

## Làm
1. 16 lưỡi lửa → lưỡi lửa thuỷ tinh CONG, mỗi lưỡi là dải hở (mép trước RIM/trắng, mép sau SHADE, lòng rỗng), đầu ngọn hồng C[3]/C[4] móc ngược và quất (lay 8–10 Hz ở đầu, gốc ít), dài ngắn khác nhau (hash), bay ra rồi tan từ gốc lên đầu (không rải chấm). Cùng ngôn ngữ với vây xà trong _serpent-td-lib.js drawFins.
2. Chớp 2,40: giữ dẹt (K9: không khối dọc > 30 px liền ở 2,40–3,00), thêm 6–8 tia sáng ngắn 1 px.
3. Tàn: 40 tàn bay cong (một số có vệt đuôi 2–3 px), rơi xuống sàn có bóng, đốm sàn nguội C[3]→C[2]→C[1].
4. Hồn xà V: giữ, chỉnh cho mượt (mờ dần bằng co từ đuôi, không chấm trắng lẻ — K12).
5. Trước/sau 3D: z > 1e-3 → front, còn lại back; hai bên cùng tham số (K6).

## write_scope
src/fx/di-hoa/_vanlac-td-burst.js (CHỈ file này). Ảnh/thử nghiệm: records/.

## done_when
- `node tools/check.mjs di-hoa/van-lac-td` không lỗi.
- `node tools/gate.mjs di-hoa/van-lac-td --at 2.4,2.45,2.5,2.6,2.7,2.8,2.9,2.97` in GATE PASS; tự xem strip tối đa 3 vòng.
- `node tools/cards/van-lac-td-measure.mjs`: K1 ≥ 99 %, 0 cam/xanh; K3/K7 ≤ 2 %; K9 ≤ 30 px; K12 ≤ 2 %; K13 trung vị ≤ 4 ms.
- Báo cáo: tham số, số đo, tự chấm.

## do_not
Không sửa file khác (van-lac-td.js, _serpent-td-lib.js, _vanlac-td-common.js, _vanlac-td-floor.js). Không màu ngoài bảng (C, RIM #efe9ee, SHADE #b9b3c4, TINT #d8d0e0, ASH). Không cột lửa. Alpha chỉ 0/1. CẤM cắt pixel hình chữ nhật để đạt số đo.

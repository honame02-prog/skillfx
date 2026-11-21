# VL3b — THỬ NGHIỆM hướng mới: MÃ sinh chuyển động, imagegen chỉ làm ĐÍCH thẩm mỹ

Hướng A (VL3a: flipbook imagegen 8 khung + rig) người dùng chấm CHƯA ĐẠT: lưỡi thành dải đặc, mất lòng rỗng VL1; lay hiền, không bùng; ngọn mảnh 1 px. Hướng VL2 (16 ảnh tĩnh dời/xoay) cũng bị chê "motion từng khung quá yếu". Kết luận: imagegen không cho chuỗi khung có chuyển động thật → để MÃ tính từng khung.

Cùng phạm vi thử như VL3a để so: 1 lưỡi lửa, pha hút vào 1,0 s (30 khung).

## Đích thẩm mỹ (ảnh, không phải số)
Ngôn ngữ hình VL1 đã duyệt: exp/VL1/keys/k2.png, k3.png, exp/VL1/gen-04-concept.png, gen-detail.png, exp/VL2/src/inhale-A.png: lưỡi lửa cuộn xoắn ốc ở đầu, LÒNG RỖNG (alpha 0 giữa), mép ngà #efe9ee/hồng #ffb3c6 ngoài, xám tím #b9b3c4 trong, gân hồng #ff4f7a/#a8204a, gốc dày đầu thon. Mẫu "mã vẽ đạt" trong dự án: src/fx/di-hoa/thanh-lien-td.js (Thanh Liên td v7, cách lửa lưỡi cuộn và lay).

## Cách làm
1. exp/VL3b/flame.mjs (Node, không cài gói; dùng painter/tiện ích sẵn trong src/core nếu hợp): lưỡi lửa = sống (spine) đường cong ~12–20 điểm, bị trường nhiễu cuộn (curl noise) cuốn theo thời gian → đầu ngọn quất, cuộn, tách 1–2 ngọn phụ rồi nhập lại; bề rộng theo hồ sơ gốc dày đầu thon; vỏ = dải mép 2–3 px (ngoài sáng, trong xám tím), lòng rỗng alpha 0; gân hồng chạy dọc thân, trôi theo thời gian.
2. Vẽ ở 4× rồi thu về 1× (đa số phiếu/ngưỡng), ép bảng exp/VL1/palette.json (dải vanlac), alpha 0/255, bỏ cụm < 3 px. Không dither.
3. Chuyển động: quỹ đạo xoắn hút vào như VL3a (ngoài ~90 px → ngực), easing chậm-nhanh, lay bùng mạnh (tần số 6–10 Hz ở đầu ngọn, biên độ lớn hơn gốc), 4–8 tàn lửa tách khỏi đầu ngọn, 2 khung cuối hút vào tâm có chớp. Chia back/front theo y so với chân.
4. Tự so với đích: dựng 1 khung tĩnh tương đương k2 VL1 đặt cạnh ảnh VL1, tự chấm "cùng ngôn ngữ hình?" bằng mắt; tối đa 3 vòng chỉnh.

## write_scope
exp/VL3b/**

## done_when
- exp/VL3b/frames/{back,front}/000..029.png (240×220, alpha 0/255, 0 pixel ngoài bảng); exp/VL3b/flame-loop.gif (lưỡi cháy tại chỗ 2 s, 3×, 30 fps); exp/VL3b/test.gif (3×, ghép nhân vật D:/SkillFX_TuThienChi_HoaLien/tienson/art/daosi/daosi.png, nền #23222a); exp/VL3b/compare.gif (trái VL3a test, phải VL3b, cùng tốc độ); exp/VL3b/style-check.png (khung VL3b cạnh VL1 k2/k3, 3×).
- `node exp/VL3b/build.mjs` chạy lại được, in PASS (kích thước, alpha, bảng màu, đủ khung, % pixel mép thuộc cụm ≥ 2 px, tỉ lệ lòng rỗng/diện tích bao lưỡi ≥ 30 %).
- exp/VL3b/NOTES.md: tham số, số đo, tự chấm (lửa có bùng/quất? lòng rỗng? cùng chất VL1?), so với VL3a.

## do_not
Không sửa ngoài exp/VL3b (src/ chỉ đọc). Không gai/tinh thể, không dither, không alpha mềm, không cài gói npm.

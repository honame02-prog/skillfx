# VLD1 — Vẫn Lạc td: chi tiết SÀN (vòng ấn, nứt đất, xà phá đất)

Người dùng đã DUYỆT HƯỚNG nháp v3b (21/11). Việc này chỉ làm CHI TIẾT lớp sàn, không đổi nhịp, không đổi hoả xà.
Kịch bản + bảng tiêu chí: ../design/tienson/08-van-lac-topdown.md (đọc hết, nhất là bảng K1–K15). Đích hình: ../design/tienson/ref-vanlac-xc/gen-02-storyboard.png (sàn: vòng ấn đỏ hồng, bên trong nứt thành mạng ô đa giác phát sáng, vài vết nứt lẻ ngoài vòng). Ảnh nháp đã duyệt: ../deliver/tienson/08-van-lac-td-v3b-review.png.

## Hiện trạng
src/fx/di-hoa/_vanlac-td-floor.js: seal() (vòng ấn + 12 vết nứt tia + 2 đốm xà trồi), dust() (bụi cuốn). Được van-lac-td.js gọi qua painter gương (chỉ nửa phải x ≥ 0 được giữ rồi chép sang trái → mọi hình tự đối xứng; vẽ cả 2 bên cũng được, nửa trái bị bỏ).
Sàn nén dọc SQ = 0.5. Gốc (0,0) = chân mục tiêu. Mốc thời gian trong _vanlac-td-common.js.

## Làm
1. Trong vòng ấn: nứt đất thành MẠNG Ô đa giác (kiểu Voronoi, 10–16 ô trên nửa phải), nứt lan từ tâm ra trong 0,08–0,40 s; khe nứt lõi sáng C[4]/C[3], mép C[2], ô nào gần tâm sáng hơn; sáng theo sealGlow (3 nhịp + nổ 2,40). Giữ vòng ngoài + vòng trong vạch đứt + ký tự ấn hiện có (có thể làm sắc hơn).
2. Xà phá đất tại 2 đốm (±SPOT, 0) lúc 0,40–0,60: 6–10 mảnh đất (ASH #2b2626 #5a524f #8f8580 + mép C[2]) văng lên rơi xuống có bóng, lỗ thủng tối C[0]/C[1] viền C[3] còn lại tới tàn.
3. 2–4 vết nứt lẻ ngoài vòng (ngắn, nhạt C[1]/C[2]) như storyboard.
4. Tàn 2,45–3,00: vòng và nứt nguội dần (C[4]→C[3]→C[2]→C[1]) rồi rã theo nhiễu, không chấm trắng lẻ.

## write_scope
src/fx/di-hoa/_vanlac-td-floor.js (CHỈ file này). Ảnh/thử nghiệm: records/ (đã gitignore).

## done_when
- `node tools/check.mjs di-hoa/van-lac-td` không lỗi.
- `node tools/gate.mjs di-hoa/van-lac-td --at 0.2,0.35,0.5,0.8,1.55,2.4,2.7,2.95` in GATE PASS; tự xem records/gate/di-hoa-van-lac-td/strip.png tối đa 3 vòng.
- `node tools/cards/van-lac-td-measure.mjs`: K1 ≥ 99 % và 0 pixel cam/xanh; K3, K7 floor ≤ 2 %; K12 ≤ 2 %.
- Báo cáo: tham số, số đo trên, tự chấm so storyboard.

## do_not
Không sửa file nào khác (van-lac-td.js, _serpent-td-lib.js, _vanlac-td-common.js, _vanlac-td-burst.js là của người khác). Không màu ngoài bảng (C, SHADE #b9b3c4, TINT #d8d0e0, ASH). Không alpha mềm (chỉ 0/1; dither có trật tự được). Đạt bằng hình học, CẤM cắt pixel hình chữ nhật để đạt số đo (K11). Ngưỡng trước/sau: z > 1e-3.

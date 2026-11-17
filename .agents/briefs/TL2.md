goal: Làm chi tiết ÁNH NHÌN `src/fx/di-hoa/_tinhlien-gaze.js` (hàm gaze): chùm ánh dương (layer 'back') + hiệu ứng mặt đất khi mắt nhìn chằm chằm (layer 'front': đá lơ lửng, đất nứt). Ngân sách: không nặng hơn bản port.
giữ: chùm hình nón cộng sáng mờ (o.l/o.k), lõi trắng kem + quầng vàng nhạt, tia thần quang lay, dải sáng chạy dọc chùm ở mỗi nấc mở, đốm sáng + vòng tia hổ phách xoay trên đất, hội tụ thành tia chói khi khoá, tia lửa ở chỗ chạm sen; đá vụn bay lơ lửng từ OPENS[2], rung khi khoá, bị hất khi nổ; vết nứt sáng toả từ chân mục tiêu.
chi tiết:
1. Chùm: mép chùm có 2–3 tia sáng mảnh rõ hơn (như nắng xuyên mây), bụi sáng trong chùm lấp lánh (vài hạt loé chữ thập nhỏ), cuối chùm loe nhẹ trên đất.
2. Hơi nóng: vài **đường gợn sóng mảnh** sáng (1 px, cộng sáng) bốc lên quanh mục tiêu trong chùm.
3. Tia hội tụ (LOCK..BOOM): lõi trắng 2 px + viền vàng nhạt 1 px mỗi bên, rung nhẹ 1 px, chỗ chạm sen có quầng sáng tròn nhỏ + tia lửa bắn; vòng sáng dưới chân mục tiêu nở rộng.
4. Đá lơ lửng: hình **khối đá góc cạnh** (poly 4–6 đỉnh, mặt sáng/tối 2 bậc DUST), xoay chậm, rơi rớt vài hạt bụi khi bay lên; vài viên nhỏ xoay quanh mục tiêu.
5. Vết nứt: nhánh rẽ, sáng từ trong (lõi L[6], viền L[3]), **ánh sáng tràn** lên mép nứt (cộng sáng nhẹ), nứt toả xa dần trong 0,35 s rồi rực lên ngay trước BOOM.
write_scope: src/fx/di-hoa/_tinhlien-gaze.js
done_when: `node tools/check.mjs di-hoa/tinh-lien` không FAIL; `node tools/gate.mjs di-hoa/tinh-lien --at 1.05,1.65,2.25,2.7,3.1,3.3,3.5 --zoom 3` PASS; tự xem strip 2 vòng.

## Bối cảnh chung (Tịnh Liên Yêu Hoả — chi tiết, chia phần)
- Kịch bản: D:/SkillFX_TuThienChi_HoaLien/design/di-hoa/05-tinh-lien-yeu-hoa.md (đọc v2 và v3 cuối file). Nháp đã DUYỆT: src/fx/di-hoa/tinh-lien-draft.js — chi tiết hoá, không đổi ý tưởng, nhịp hay bố cục.
- Chiêu = khung `src/fx/di-hoa/tinh-lien.js` (Opus giữ) + 4 phần `_tinhlien-{sky,gaze,lotus,blast}.js`. File phần của bạn ĐÃ có code port y nguyên từ nháp — nâng cấp nó. CHỈ SỬA ĐÚNG FILE PHẦN CỦA MÌNH.
- Giao diện cố định: `export function <tên>(p, t, layer)` — layer 'back' | 'front'; stateless, tất định theo t (hash theo chỉ số, không Math.random). Bảng tính sẵn ở cấp module, hoặc memo thuần (khoá theo t lượng tử, kết quả không phụ thuộc thứ tự gọi) đều được.
- Dữ liệu chung: `src/fx/di-hoa/_tinhlien-common.js` (palette L sen/ánh sáng 0 nâu sẫm…6 trắng; LID/IRIS/PUPIL/VEIN mắt; DUST 5 bậc; CLOUD 4 bậc; mốc APPEAR/OPENS/LOCK/BOOM/SHUT/GHOST/END; LC tâm sen, EC tâm mắt; openAt/eyeK/lockAt/pupilW/pulses; grid() lưới nhiễu thô nội suy). KHÔNG sửa file này.
- Thứ tự vẽ: back = sky, gaze, lotus, blast; front = gaze, blast, lotus (bóng sen trong bụi nằm trên nón bụi).
- **Không chấm lấm tấm:** alpha < 1 qua p.dot/p.shade(o.a)/p.line bị vẽ thành chấm dither, vừa xấu vừa làm GIF nặng. Dùng **mảng màu đặc theo bậc** (o.a = 1), mép răng cưa; hiện/tan bằng co/nở hoặc ngưỡng mật độ, không bằng alpha. Ánh sáng cộng (o.l/o.k, p.glow) và p.disc (blend mịn) thì được.
- Painter: p.shade(x0,y0,x1,y1,(x,y,o)), p.line, p.polyline, p.poly, p.dot, p.disc, p.glow, p.put(sx,sy,c) (toạ độ màn hình, qua p.cellX/p.cellY). Toạ độ local: chân nhân vật gốc, mục tiêu x=150, đất y=0, khung x −60…299, y −235…24. Không vẽ ra ngoài khung.
- Hiệu năng: cả chiêu phải `node tools/gate.mjs di-hoa/tinh-lien` PASS (trung vị ≤ 5 ms, p95 ≤ 16 ms). Bản port hiện: trung vị 4,7 ms — **gần trần**, nên phần của bạn KHÔNG được nặng hơn bản port (ngân sách ghi trong brief riêng). Thêm chi tiết thì phải tối ưu bù. Máy có thể đang chạy 3 việc khác nên số dao động ±40%: so trước/sau trên cùng lệnh, chạy 2 lần.
- Thời gian: việc nhỏ, mục tiêu ≤ 12 phút. Xem strip 2 vòng, mỗi vòng sửa chỗ xấu nhất. Báo cáo: đã thêm gì, perf trước/sau.
- KHÔNG: sửa file khác ngoài write_scope; tạo GIF/MP4; đổi act/nhịp/mốc thời gian.

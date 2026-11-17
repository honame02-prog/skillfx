goal: Làm chi tiết ĐOÁ SEN LỬA `src/fx/di-hoa/_tinhlien-lotus.js` (hàm lotus): sen sống (APPEAR..BOOM) và bóng sen trong nón bụi (GHOST). Ngân sách: không nặng hơn bản port (≤ ~1 ms khung nặng nhất).
giữ: 3 vòng cánh (6/5/3) + đài sen, **cả đoá chập chờn như ngọn lửa** (viền cánh gợn, đầu cánh tưa lửa, cả đoá thở/lắc/méo), nén lại trắng loá ở LOCK..BOOM; bóng sen vàng lớn trong bụi 3,9–4,9 s.
chi tiết:
1. Cánh: 2–3 bậc màu đặc trong mỗi cánh (gốc vàng nhạt → thân kem → mép trắng), gân giữa mảnh; đầu cánh **tách ra lưỡi lửa nhỏ** bốc lên rồi tắt (không chỉ nhô dài).
2. Lõi sen: **đài gương sen** (hình chén dẹt màu vàng, có 5–7 chấm hạt sen sáng) giữa vòng cánh trong — dấu hiệu nhận ra hoa sen.
3. Ánh sáng: sen toả cộng sáng nhẹ (p.glow nhỏ hoặc o.l) nhịp theo hơi thở; tàn lửa trắng bay lên.
4. Nén (LOCK..BOOM): cánh cụp vào, xoắn nhẹ quanh tâm, màu chuyển trắng từng bậc, rung cao tần; cuối cùng thành quả cầu trắng chói có bóng cánh mờ.
5. Bóng sen trong bụi: hiện **từng cánh lần lượt** (lệch nhịp), có lúc chập chờn mất vài cánh; viền sáng L[3]/L[4] + lòng vàng sẫm đặc; cộng sáng nhẹ quanh. Không dùng alpha dither.
write_scope: src/fx/di-hoa/_tinhlien-lotus.js
done_when: `node tools/check.mjs di-hoa/tinh-lien` không FAIL; `node tools/gate.mjs di-hoa/tinh-lien --at 0.65,1.2,2.4,3.1,3.3,4.0,4.4,4.8 --zoom 3` PASS; tự xem strip 2 vòng.

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

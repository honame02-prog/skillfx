goal: Làm chi tiết TRỜI `src/fx/di-hoa/_tinhlien-sky.js` (hàm sky, layer 'back'): mây tụ/rẽ + MẮT THÚ. Ngân sách: không nặng hơn bản port (mây đã memo 10 fps vẽ theo dải — giữ cơ chế này).
giữ: mây tím xám tụ 0–0,6 s, rẽ khe quanh mắt, mép khe ánh hổ phách thành mảng; mắt hạnh nhân, mở 3 nấc giật, tròng hổ phách, con ngươi khe dọc, co lại khi khoá (LOCK), nhắm ở SHUT; lông mi lửa vàng.
chi tiết (mắt phải ra **mắt thú yêu**, không phải mắt người):
1. Mí: da mí có **vảy/nếp sừng** tối (2–3 bậc LID), gờ mày dày nhô phía trên, khoé mắt nhọn kéo dài như mắt rắn/hổ. Mí run nhẹ ở mỗi nấc mở.
2. Tròng: vòng ngoài sẫm, sợi toả từ tâm, đốm vàng sáng gần con ngươi, quầng đỏ sẫm quanh khe; ánh ướt: 1 vệt phản chiếu cong trên tròng. Con ngươi **giãn/co** mượt theo pupilW và **liếc nhẹ** bám mục tiêu (dưới, x=150).
3. Khi khoá: mí dưới nhích lên (nheo mắt), tròng sáng lên 1 bậc, lông mi lửa dựng cao.
4. Mỗi nấc mở: mép khe mây **loé hổ phách mạnh** rồi dịu, khe mây gợn như bị đẩy (gợn sóng chạy ra ngoài).
5. Mây: khối mây có 3 bậc sáng tối rõ (đỉnh khối sáng hơn), mép răng cưa đẹp; vài dải mây mỏng xoáy chậm quanh khe. Lúc tan (5,0–6,0 s): mây xoáy ra và mỏng dần bằng ngưỡng, không bằng alpha.
6. Lúc nhắm (SHUT): khe mắt khép, còn một **đường sáng hổ phách** mảnh rồi tắt.
write_scope: src/fx/di-hoa/_tinhlien-sky.js
done_when: `node tools/check.mjs di-hoa/tinh-lien` không FAIL; `node tools/gate.mjs di-hoa/tinh-lien --at 0.4,1.05,1.65,2.6,3.2,4.5,5.3,5.8 --zoom 2` PASS; tự xem strip 2 vòng (dùng --zoom 3 để soi mắt).

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

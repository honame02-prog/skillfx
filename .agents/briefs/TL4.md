goal: Làm chi tiết VỤ NỔ `src/fx/di-hoa/_tinhlien-blast.js` (hàm blast), BOOM (3,4 s) → END. Ngân sách: không nặng hơn bản port (nón bụi đã dùng grid() lưới thô + bảng theo hàng — giữ cơ chế này).
giữ: chớp trắng + xung kích dẹt sát đất, lớp bụi thấp cuộn ra hai bên, **nón bụi chữ V** (gốc hẹp ở hố, loe lên, cao ~140 px trong 0,6 s, đứng ~1,5 s rồi sụp/loe/tan tới hết), đá văng parabol, hố cháy. Mảng màu đặc theo bậc, không dither.
chi tiết:
1. Chớp: vài **tia sáng toả** ngắn quanh tâm 2–3 khung; xung kích 2 vòng (vòng sau mảnh hơn), cuốn theo một **váy bụi** sát đất.
2. Nón bụi: mép trên **cuộn như súp lơ** (các khối tròn rõ), bóng đổ trong lòng nón theo khối, mép sáng phía trên-trái; trong 0,6 s đầu có **vệt đất đá bắn thẳng lên** trong lòng nón (sọc tối mảnh). Lúc bóng sen hiện (GHOST 3,9–4,9 s) lòng nón **ấm lên** (các bậc gần tâm chuyển sang tông vàng nâu như được rọi từ trong).
3. Đá: khối góc cạnh (poly 4–5 đỉnh, 2 bậc màu), xoay khi bay, **nảy 1 lần** khi chạm đất rồi nằm; vài viên to kéo vệt bụi.
4. Tan: bụi mịn lắng (hạt rơi chậm), lớp bụi mỏng trên mặt đất thu dần; hố có gờ đất nhô, lõi đỏ nguội dần. Khung cuối trống.
write_scope: src/fx/di-hoa/_tinhlien-blast.js
done_when: `node tools/check.mjs di-hoa/tinh-lien` không FAIL (đặc biệt không còn px ở t = END); `node tools/gate.mjs di-hoa/tinh-lien --at 3.42,3.5,3.7,4.0,4.4,5.0,5.6,6.2 --zoom 2` PASS; tự xem strip 2 vòng.

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

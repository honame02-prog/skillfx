goal: LÀM LẠI phần bụi trong `src/fx/di-hoa/_tinhlien-blast.js` theo **lối pixel art** (người dùng chê bụi hiện tại "không có chất pixel"): bỏ hẳn cách tô trường nhiễu theo bậc (coneDust bằng p.shade + grid, mảng loang rằn ri, góc vuông lởm chởm). Giữ chớp, vòng xung kích, đá văng, hố.
cách dựng mới — **khói pixel từ các cụm (puff) đặt có chủ ý**:
1. Một cụm = hình tròn bán kính r có: **viền tối 1 px** (disc r+1 màu DUST[0]), thân DUST[2], **mảng tối** hình lưỡi liềm phía dưới-phải (đĩa lệch +0.25r,+0.3r, cắt trong thân) DUST[1], **mảng sáng** phía trên-trái (đĩa lệch −0.3r,−0.35r, bán kính 0.55r) DUST[3], một **điểm sáng** nhỏ DUST[4]. Toàn bộ màu đặc, không alpha, không dither. Có thể dùng p.disc(…, 1) (blend alpha 1 = đặc) hoặc p.shade trên hộp của cụm.
2. Vẽ cụm từ sau ra trước (cụm cao/xa trước, cụm thấp/gần sau) để viền cụm sau đè lên thân cụm trước → ra **khối súp lơ** có đường tách giữa các cụm, đúng kiểu khói pixel.
3. **Nón bụi chữ V** (giữ dáng, nhịp đã duyệt: phụt lên ~140 px trong 0,6 s, đứng ~1,5 s, rồi sụp/loe/tan): khoảng 40–55 cụm, mỗi cụm có chỉ số cố định (hash): độ cao tương đối s∈[0,1], lệch ngang trong bề rộng nón ở độ cao đó, bán kính tăng theo độ cao (gốc 5–7 px, miệng 12–18 px), vòng miệng nón là hàng cụm to nhất (vương miện). Cụm nhích lên chậm và nở nhẹ theo thời gian; khi tan: cụm **co nhỏ dần** rồi biến mất lần lượt (không mờ), màu nguội dần (lùi 1 bậc).
4. **Lớp bụi thấp** cuộn ra hai bên sát đất: 20–30 cụm nhỏ (r 4–10) cùng kiểu, lăn ra xa rồi co lại.
5. Khi bóng sen hiện (GHOST 3,9–4,9 s): các cụm gần tâm đổi sang bảng ấm (WARM đã có trong file) như được rọi từ trong.
6. **Bụi lắng** cuối: 20–30 hạt bụi 1–2 px màu DUST[2]/[3] rơi chậm, lắc nhẹ. Lớp bụi mỏng trên đất thu dần. Khung cuối trống.
7. Chuyển động có thể lượng tử 15 fps cho cụm (nhìn như hoạt hình pixel, GIF nhẹ hơn) — tuỳ bạn, ghi lại lựa chọn.
tham khảo phong cách: khói/bụi trong game pixel (cụm tròn có viền tối, 3–4 bậc, ánh sáng trên-trái). Không tô gradient, không glow lớn cho bụi.
write_scope: src/fx/di-hoa/_tinhlien-blast.js
done_when: `node tools/check.mjs di-hoa/tinh-lien` không FAIL (không còn px ở t = END); `node tools/gate.mjs di-hoa/tinh-lien --at 3.45,3.6,3.9,4.4,5.0,5.6,6.2 --zoom 3` PASS; tự xem strip 2 vòng — tiêu chí: nhìn vào phải thấy **từng cụm khói tròn có viền và khối**, không còn mảng loang.

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

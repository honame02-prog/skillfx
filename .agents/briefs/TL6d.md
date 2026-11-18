goal: Làm chi tiết PHẦN KẾT "Nhãn Táng Liên" trong `src/fx/di-hoa/_tinhlien-end.js` (GHOST 3.8 → END 7.8).
hiện trạng (chấm strip): sen trong bụi (3.8–4.3) không đọc ra; chớp mảnh lúc mắt sập không rõ; dấu sen cháy (6.3–7.6) chỉ là vũng đỏ elip, không có hoa văn sen; tro thưa.
nội dung (kịch bản v4 "Phần kết"):
1. lightLotus (3.8–4.8): đoá sen trắng hiện BẰNG ÁNH SÁNG trong lòng nón bụi (tâm ~[TX, -60], cao ~70 px): viền cánh sáng L[4..6] liền nét, 3 vòng cánh như sen ở ngực nhưng lớn, lòng cánh là ánh cộng sáng ấm (p.shade o.l/o.k), không dán đa giác đặc. Trục ánh (shaft) từ mắt rọi xuống xuyên bụi.
2. column (4.75–5.8): cột xoắn ngược lên trời chui vào con ngươi (EC): xoắn rõ 2–3 vòng, dày ở chân, thon ở đỉnh, mang bụi nâu-tro + tàn lửa trắng-vàng xoáy; đoá sen sáng bị kéo dài, cuốn theo; mặt đất trống dần từ dưới lên.
3. gulp (5.72–5.9): khi mắt sập, chớp trắng MẢNH ngang mắt (đường sáng dài, 2–3 khung) + vòng gợn nhỏ ở EC; rõ nhưng không chớp toàn màn.
4. ash (5.9–7.55): tro trắng rơi như tuyết: 40–70 mảnh 1×1/2×1/1×2 opaque (L[4..5], vài L[3]), rơi chậm lắc ngang, phân bố đều khắp khung, thưa dần rồi hết trước END.
5. scorch (6.0–7.8): DẤU SEN CHÁY trên đất quanh chân mục tiêu (TX, 0), phối cảnh dẹt (elip ~90×18 px): hoa văn sen 8–12 cánh nằm, nét 1 px trắng-vàng (L[5]/L[3]), lõi tròn, vòng ngoài; nguội dần trắng → vàng → cam → đỏ sẫm → tắt (từ ngoài vào trong), vài làn khói mảnh bốc lên. Khung cuối (END) TRỐNG hoàn toàn.
hiệu năng: ending() (back+front) trung vị ≤ 0,4 ms trên cả chiêu, p95 ≤ 2,5 ms, max ≤ 4 ms (hiện front p95 2,46, max 3,93).
write_scope: src/fx/di-hoa/_tinhlien-end.js
done_when: `node tools/gate.mjs di-hoa/tinh-lien --at 3.9,4.3,4.7,5.0,5.4,5.75,5.82,6.2,6.8,7.4,7.8` không lỗi check; số đo đạt ngân sách; tự xem strip 2–3 vòng.
Đọc thêm: .agents/briefs/TL6-common.md (bối cảnh chung, luật pixel, cách đo).

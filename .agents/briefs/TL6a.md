goal: Làm chi tiết + tăng tốc BẦU TRỜI và MẮT THÚ trong `src/fx/di-hoa/_tinhlien-sky.js` (darkness, clouds, rift, eye; 0.6–6.0 s).
hiện trạng (bản v4, chấm strip): mắt đọc như thấu kính gần đối xứng; mí trên chưa đủ nặng/sụp; lửa viền đều như hàng rào; vết rách trời chỉ là vệt phẳng, ít khe tối; màn hình gần như không tối dần theo nấc mở.
nội dung (theo kịch bản v4 "Mắt v4: vết rách trên trời"):
1. Dáng thú BẤT ĐỐI XỨNG: mí trên dày, sụp, đè xuống tròng (che ~25–30% tròng phía trên ngay cả khi mở hết); khoé trong tròn, khoé ngoài nhọn hếch lên; mí dưới mỏng. Mắt to, hai khoé tràn gần/ra mép khung (EW=100 bán trục trong common; được vẽ ra ngoài khung).
2. Tròng chiếm ~85% khe, gần như không lòng trắng; vân tròng toả từ tâm, quầng đỏ quanh con ngươi; con ngươi khe dọc dài; lúc khoá (lockAt) con ngươi giật co trong 2 khung và cả tròng rực sáng (IRIS[4]). Giữ 2–3 đốm ướt (glint) trắng.
3. Lửa mí: lưỡi lửa bị HÚT NGƯỢC vào mắt, không đều — to ở khoé ngoài, nhỏ dần vào trong, lệch pha nhau, bập bùng; tàn lửa xoáy về con ngươi.
4. Vết rách: quanh mắt là các khe tối rách nứt (tối hơn CLOUD[0], viền lửa cam-vàng mảnh), nhánh nứt toả ra theo độ mở mắt; mây bị kéo xoáy về phía mắt (xoáy rõ, mềm).
5. Áp bức: darkness tăng rõ theo từng nấc (LEVEL 0.25/0.6/1) — dải màu tối / dither theo lưới, giữ vùng nhân vật–mục tiêu–đất (y > -60, x 0..200) sáng hơn.
6. Nhắm sập (SHUT 5.72–5.9): mí trên đập xuống nhanh, khép thành đường lửa mảnh rồi tắt; vết rách khép lại.
hiệu năng (bắt buộc): eye() hiện 3,4 ms trung vị (vòng từng pixel _tinhlien-sky.js:215-225 gọi eyePx với sqrt/atan2/sin + flame()). Ngân sách cả sky(): trung vị ≤ 1,8 ms, p95 ≤ 3,5 ms, max ≤ 5 ms. Gợi ý: bảng tra dựng sẵn (memo thuần) cho góc/bán kính từng ô của tròng theo toạ độ tương đối; lưới thô + nội suy cho vân; tính flame theo cột chứ không theo pixel. clouds: tránh tính lại cả bước mây ở 10 fps gây gai 2,6 ms (lưới thô hơn hoặc chia việc).
write_scope: src/fx/di-hoa/_tinhlien-sky.js
done_when: `node tools/gate.mjs di-hoa/tinh-lien --at 0.7,1.05,1.65,2.25,2.8,3.05,3.3,5.6,5.8,5.95` không có lỗi check; số đo sky() đạt ngân sách; tự xem strip 2–3 vòng.
Đọc thêm: .agents/briefs/TL6-common.md (bối cảnh chung, luật pixel, cách đo).

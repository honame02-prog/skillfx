goal: Làm chi tiết VỤ NỔ, NÓN BỤI và ĐÁ VĂNG trong `src/fx/di-hoa/_tinhlien-blast.js` (BOOM 3.4 → INHALE 4.75–5.8).
hiện trạng (chấm strip): bụi là khối tròn xám viền đều như bong bóng/chùm nho; đất nâu thành cụm tròn xếp hàng dọc mặt đất như hạt châu; nón chưa đọc ra chữ V cao ~170 px; lúc 4.9–5.5 chỉ thấy cột trắng hẹp.
nội dung (kịch bản v3 "nón bụi" + v4 "Bụi v4"):
1. Nón chữ V ngược: gốc hẹp ở hố nổ (TX, 0), miệng loe lên trời cao ~170 px, phụt lên trong 0.6 s (out3), đứng sừng sững tới INHALE. Thân nón có sọc dọc đất phụt.
2. Phân cấp cỡ: 6–8 khối khổng lồ (r 24–34) tạo dáng, cụm vừa lấp, cụm nhỏ viền mép; khối chồng nhau, CHUNG đường viền (giữ shared-outline), không viền đều quanh từng khối. Mép vỡ thành vài pixel lẻ có trật tự (dither ở mép), không lấm tấm.
3. Kết cấu: mỗi khối 2–3 tông theo hướng sáng (trên-trái), rãnh tối cong theo khối, đốm đất đá; đất nâu (DUST[0..2]) dưới chuyển dần lên xám tro (DUST[3..4]) trên.
4. Chuyển động: vương miện cuộn tròn ra ngoài rồi xuống (cuộn nấm), khối trong lòng cuộn chậm; khi reveal() các khối được rọi sáng từ trong (giữ cơ chế v4).
5. Đá văng: 14–20 viên cỡ khác nhau (2–6 px, mặt sáng/mặt tối, xoay), bay parabol tứ tung, nảy 1 lần, bụi nhỏ khi chạm đất. Bỏ hàng cụm tròn xếp đều sát đất; groundDust thành dải cuộn ngang loe ra hai bên, phủ gần hết khung, che cả người thi triển một lúc.
6. Hít (INHALE): bụi bị kéo xoắn lên thành cột về EC (giữ hàm inhale), cột mang màu bụi nâu-tro + tàn lửa, không thành cột trắng hẹp.
hiệu năng: blast() (back+front) trung vị ≤ 0,4 ms trên cả chiêu, p95 ≤ 3 ms, max ≤ 4,5 ms (hiện p95 2,15, max 3,05).
write_scope: src/fx/di-hoa/_tinhlien-blast.js
done_when: `node tools/gate.mjs di-hoa/tinh-lien --at 3.42,3.5,3.65,3.85,4.1,4.4,4.7,4.95,5.2,5.5` không lỗi check; số đo đạt ngân sách; tự xem strip 2–3 vòng.
Đọc thêm: .agents/briefs/TL6-common.md (bối cảnh chung, luật pixel, cách đo).

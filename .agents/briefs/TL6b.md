goal: Làm chi tiết ĐOÁ SEN LỬA (`src/fx/di-hoa/_tinhlien-lotus.js`) và ÁNH DƯƠNG + DẤU NHÌN (`src/fx/di-hoa/_tinhlien-gaze.js`), 0.6–3.45 s.
hiện trạng (chấm strip): sen nhỏ, giống sao nổ trắng hơn hoa sen, viền vàng yếu, chấm sáng lấm tấm quanh đoá; ít thấy cánh chập chờn. Chùm sáng hơi xám, chưa ấm kem-vàng, thiếu hạt hơi nóng; dấu nhìn trên đất chỉ là elip trắng, chưa có vòng tia hổ phách xoay.
nội dung sen (kịch bản v2 "Liên hoa hoả diễm" + v3):
1. 3 vòng cánh đọc rõ hình sen nhìn chếch: 6 cánh ngoài (rộng, xoè), 5 cánh giữa, 3 cánh nụ; cao ~40–48 px lúc lớn nhất (tâm LC). Mỗi cánh là lưỡi lửa trắng hình cánh sen: thân L[6]/L[5], viền 1 px L[3]/L[4], chân L[2], gân giữa vàng nhạt; mép gợn liên tục, đầu cánh tưa thành 1–3 ngọn lửa nhỏ LIỀN thân (không tách thành chấm rời).
2. Chập chờn: cả đoá thở phồng/xẹp, lắc lư, từng cánh lệch pha; không bao giờ đứng yên nhưng không giật. Bỏ hạt sáng lẻ quanh đoá; thay bằng 3–6 ngọn lửa nhỏ hình giọt liền khối bay lên.
3. Nén (LOCK→BOOM): cánh khép vào, đoá co ~50% và sáng dần thành trắng chói; chỗ tia hội tụ chạm sen bắn tia lửa ngắn (đường 1 px, opaque).
nội dung ánh dương:
4. Chùm: lõi hẹp trắng kem, quầng vàng nhạt ấm (cộng sáng p.shade o.l + o.k nhẹ; không xám), tia thần quang dọc lay nhẹ, sáng tối khác nhau; nhịp sáng chạy dọc chùm 0.25 s mỗi nấc (pulses).
5. Hạt hơi nóng bốc lên trong chùm (que 1×2 px opaque L[4], số ít, có trật tự, không lấm tấm).
6. Dấu nhìn trên đất: elip sáng + vòng tia hổ phách ngắn (IRIS[2..3]) xoay chậm quanh mục tiêu; đá vụn lơ lửng (2.2–3.4) và nứt đất toả sáng khi khoá giữ như v4 nhưng sạch hơn.
7. Hội tụ (LOCK): chùm thu thành tia mảnh chói đốt thẳng vào sen.
hiệu năng: lotus() + gaze() cộng lại (back+front) trung vị ≤ 1,0 ms, p95 ≤ 2,5 ms.
write_scope: src/fx/di-hoa/_tinhlien-lotus.js src/fx/di-hoa/_tinhlien-gaze.js
done_when: `node tools/gate.mjs di-hoa/tinh-lien --at 0.65,0.9,1.1,1.7,2.3,2.7,3.0,3.15,3.3,3.38` không lỗi check; số đo đạt ngân sách; tự xem strip 2–3 vòng (vùng quanh mục tiêu x≈150).
Đọc thêm: .agents/briefs/TL6-common.md (bối cảnh chung, luật pixel, cách đo).

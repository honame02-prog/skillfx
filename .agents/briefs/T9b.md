# T9b — `src/fx/ultimate/heaven-finger.js`: chỉ hiện dần, tù thiên, giáng

Đọc `.agents/briefs/T9-common.md` trước. Chỉ sửa `src/fx/ultimate/heaven-finger.js`.

## Bàn tay MỚI (thay hẳn tay cũ)
Dùng `src/fx/ultimate/_hand-hi.js` (Opus tạo từ ảnh mẫu): 119x220, '.' trống, '0'..'f' độ sáng 16 mức, giữ nguyên phù văn
khắc của ảnh mẫu. `HAND_TIP` = toạ độ đầu ngón. Vẽ ở **1x** (không phóng). Tham chiếu chất lượng: `../cloud_ref/cloud_hand_crop.png`
(bản người dùng khen đẹp) — tay phải đạt tới mức đó: khối tròn đầy, phù văn kín, viền phát sáng.
- Map độ sáng → ramp vàng 8–10 bậc (bóng nâu-đồng sâu, giữa vàng kim, sáng vàng nhạt, đỉnh trắng ngà rất ít).
- **Viền ngoài 1px sáng + glow** (light buffer) như ảnh mẫu; phù văn (pixel sáng nhất) **phát sáng nhẹ, nhịp đập** chạy dọc tay.
- Cổ tay tan dần lên trên vào mây (alpha theo y), không có mép cắt.
- Hiệu năng: tiền xử lý danh sách pixel 1 lần ở module scope.

## Chuyển động
- **EMERGE..REVEALED**: đầu ngón xuyên qua lõi mây ở CLOUD_BASE, tay **từ từ** hạ xuống (ease-out, chậm, nặng) tới HOVER_TIP;
  phù văn sáng dần; rung nhẹ (1px) như vật quá nặng.
- **Bóng tay** trên mặt đất (elip tối, trong mờ) to và đậm dần khi tay xuống; **vòng áp lực** phù văn rơi từ đầu ngón xuống
  đất từng nhịp (mỗi nhịp nhanh hơn), chạm đất thì ép bụi bẹp ra.
- **REVEALED..RELEASE — Tù thiên**: **lồng trời** khép lại: 8–12 **thanh phù văn** sáng từ mây cắm thẳng xuống đất quanh vùng
  (nửa xa vẽ sau, nửa gần vẽ trước, theo `band`/phối cảnh elip), một vòm/khung giam khoá lại; tay bùng sáng phù văn; màu rút
  (dùng `drain` của `_lib.js` 1–2 khung); 0.15 s im lặng trước RELEASE.
- **RELEASE..HIT**: tay giáng từ HOVER_TIP xuống 0 trong 0.18 s (ease.inQuart), **smear** dọc (kéo dài thân tay 1–2 khung) +
  vệt tốc độ; thanh lồng **bị kéo theo** cắm sâu xuống.
- **HIT..**: tay lún 3px, giữ ~0.8 s (rung theo dư chấn), rồi **tan thành phù văn/khối vàng** bay lên từ đầu ngón tới cổ tay,
  mảnh có hướng, nhỏ dần thành hạt; lồng tan. Khung cuối trống.

Xong: `node tools/check.mjs ultimate/heaven-finger` sạch, ≤ 4 ms/khung.

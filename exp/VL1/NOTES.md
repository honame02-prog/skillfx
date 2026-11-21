# VL1 — biên bản ảnh khái niệm

## Phạm vi và nguồn
Vòng 1/2: tự thiết kế, sinh ảnh và làm thẻ duyệt. Không sửa runtime, GPL gốc, src, tools hay deliver; không commit/push/cài gói. Các nhân vật trong hình là mục tiêu minh hoạ do imagegen tạo; không chép atlas Đạo Sĩ vào sản phẩm. Đã xem atlas 521×1041 để hiểu mức chi tiết và tỉ lệ người 57 px, xem thẻ Thanh Liên td v7 và storyboard XC để đối chiếu.

Hướng mới do brief trực tiếp cho phép, thay hướng hai xà ở thẻ cũ chỉ trong thử nghiệm VL1. Không thay quyết định dự án hoặc bản dùng trong game. Tập màu giữ nguyên ramp C bản ngang; trắng đã có trong bảng gốc nên dải mới dành hai chỗ cho #64616f và #b9b3c4, vẫn chỉ 8 màu đề xuất. Không lấy màu hồng khác để thay ramp đã chốt. Prompt ban đầu có trắng trong dải tham khảo; bảng sau xử lý dùng trắng từ GPL và thêm xám trung tính, được ghi rõ ở DESIGN/palette.json.

## Lịch sử sinh ảnh
Built-in `image_gen.imagegen`, không dùng API/CLI, không dùng code để vẽ hình chính. Bốn lần gọi: một lần tạo storyboard sáu ô, ba lần sửa cùng storyboard; đúng giới hạn ba vòng sinh lại. Mỗi storyboard chứa 5 mốc và 1 ô cận cảnh. Các crop `gen-k1..k5.png` và `gen-detail.png` là những vùng ảnh gốc được cắt nguyên pixel từ bản chọn, không phải sáu lần sinh riêng.

1. `gen-01-concept.png`: đẹp ở đường lửa, góc thấy đỉnh đầu; người quá lớn và quầng bán trong suốt làm mất lòng rỗng. Giữ ảnh nguyên, không chọn làm keys.
2. `gen-02-concept.png`: bớt glow nhưng alpha nền không về 0 (toàn ảnh có alpha 129–252). Không thể coi đây là cutout đúng; giữ nguyên làm bằng chứng, không đưa nền đó vào keys.
3. `gen-03-concept.png`: bản nền xanh khoá màu, đã có lửa rỗng nhưng ellipse còn dẹt; giữ nguyên làm bằng chứng. Không có shader khúc xạ.
4. `gen-04-concept.png`: lượt sửa cuối yêu cầu ellipse 2:1 bằng bounding box cụ thể và xoay hướng đứng. Đây là bản chọn để cắt và lượng tử; đánh giá thực tế camera ghi ở phần tự chấm. Bỏ nền xanh theo chênh kênh màu, không vẽ bù hình.

Một công cụ Node để ghi prompt bị reset trước khi ghi; đã dùng ghi file trực tiếp, prompt được giữ đầy đủ. Việc này không làm phát sinh lượt sinh ảnh.

## Các tệp để duyệt
- `sheet.png`: 5 hàng, trái là ảnh gốc sau tách nền và nearest về cỡ game, phải là bảng màu + alpha 0/255; cả hai cột phóng đúng 3×. Nhãn nằm ngoài ô hình, không đè lên artwork.
- `native.png`: 5 mốc lượng tử ở đúng 1×, giúp đánh giá tính dễ đọc thực tế. Không phải hoạt hình.
- `keys/k1.png` đến `keys/k5.png`: RGBA 240×220, nhân vật 57 px theo phép đo thủ công đầu–chân ở `layout.json`, cùng pivot chân (120,144).
- `gen-k*.png`, `gen-detail.png`: crop nguyên pixel của nguồn đã chọn. `detail-cutout.png`: cận cảnh đã tách nền, chưa ép palette; không phải atlas runtime.
- `palette.json`: tập màu hợp lệ = bảng FX gốc cộng một dải vanlac tối đa 8 màu. `transforms.json`: toạ độ crop, đo người, tỉ lệ, offset và bounding box. `verification.json`: SHA256, kích thước và kiểm từng PNG.
- `assemble.py`: chỉ cắt, tách nền, resize NEAREST, tìm màu RGB gần nhất không dither, ghép thẻ và kiểm. Không có hàm vẽ lửa, người, ellipse hay hình chính; phần text chỉ là nhãn ngoài hình.

## Kiểm tự động và giới hạn
Chạy `C:\Users\Admin\AppData\Local\Programs\Python\Python313\python.exe exp/VL1/assemble.py`; `--verify-only` kiểm lại các ảnh đã có. Tất cả đầu ra nằm trong exp/VL1. Validator đo kích thước, alpha, bảng màu, đọc toàn bộ PNG, lề không clip và kích thước thẻ. Chiều cao 57 px được suy từ các điểm đo thủ công trên ảnh gốc, không phải thuật toán tự nhận diện nhân vật. Prompt không phải bằng chứng camera đạt chuẩn.

Vòng 1 không đo FPS, không chạy hoạt hình trong engine, không xuất atlas 3 lớp, không chứng minh được 3 nhịp mạnh dần hay frame cuối sạch chỉ bằng năm hình tĩnh. Các con số thời gian trong DESIGN là chỉ định vòng 2.

## Kế hoạch vòng 2 — 90 khung, 3 lớp
1. Sau khi duyệt dáng, xin imagegen các clean plate cùng camera/pivot: không có người, cùng 3 lưỡi A/B/C ở các mốc và breakdown, từng lớp trên nền khoá màu. Không sinh độc lập 90 ảnh rồi trông chờ chúng khớp nhau.
2. Giữ ID và đường mép của từng lưỡi, điểm neo chân/tâm ngực, thứ tự che khuất. Lấy các mảng hình và chi tiết từ ảnh sinh; cắt thành đoạn có vùng nối chồng 2–3 px. Chỉ dịch/xoay/co/biến dạng mảng ảnh có kiểm soát theo quỹ đạo liên tục; không vẽ lại hình chính bằng code. Các góc chưa có ảnh cần sinh breakdown tham chiếu cùng nguồn.
3. Pha 0–9 nhóm tâm và dấu; 10–32 hút vào; 33–66 ba nhịp; 67–76 bung; 77–89 rã. Khung 89 trống. Nếu morph làm đứt mép, thêm breakdown có kiểm rồi dựng lại đoạn đó; không dùng crossfade alpha mềm.
4. `floor`: vòng và gợn trên sàn; `back`: lưỡi sau vai/nửa xa xung kích; `front`: tâm, mạch và lưỡi trước người. Dùng một bộ mask độ sâu nhất quán, render ba atlas chung size 240×220/pivot (120,144). Nhân vật minh hoạ không được nằm trong atlas FX.
5. Giữ alpha 0/255 và bảng màu cố định từ đầu đến cuối; lượng tử sau biến dạng nearest, không dither. Rà từng frame liên tiếp để sửa trôi tâm, mất thân, nhảy bậc, số lưỡi và các mảng trắng rời. Pha nổ vươn ngang, không biến thành cột.
6. Xuất bản xem trên nền sáng/tối cùng mục tiêu thật, xem riêng floor/back/front và bản ghép. Kiểm đủ 90 khung, lề khung, frame cuối, palette, alpha, atlas size, event hit và thời gian khung trong game. Không gọi hoàn chỉnh chỉ dựa trên thẻ này.

## Tự chấm trực quan — đã xem cả 5 mốc ở 1×, 3× và cận cảnh
| Tiêu chí | Điểm / 5 | Bằng chứng / giới hạn |
|---|---|---|
| Đọc ý tưởng | 4 | Tâm sáng ở ngực xuyên suốt, k2 bao quanh, k3 ép vào, k4 bung ngang, k5 chỉ còn tâm. K3 vẫn dễ đọc như chớp bên ngoài hơn cháy sâu; cần chuyển động mạch từ trong ra ở vòng 2. |
| Góc top-down 30° | 3,5 | Thấy rõ đỉnh đầu và mặt trên vai, hướng đứng đã xoay chéo; không còn đầu rồng hay camera chính diện XC. Nhưng ellipse chưa đồng nhất 0,5: nhìn/đo bounding box thủ công trên nguồn, k1/k3 khoảng 0,45–0,46; k2 khoảng 0,37; k4 khoảng 0,33; k5 khoảng 0,41. Đây là ước lượng đường ấn đứt, không phải phép khớp ellipse tự động. **Chưa đạt ràng buộc phối cảnh ở toàn bộ mốc.** |
| Lửa vô hình | 4 | Lòng lửa xuyên nền thật sau chroma key; giữ mép đục và tâm hồng. Mốc k4 nhiều nét cuộn có thể giống dải ruy băng, chưa chứng minh được chập chờn bằng ảnh tĩnh. |
| Pixel ở cỡ thật | 3,5 | Không dither, không blur, alpha hai mức. Ở 57px người, nhiều mép lửa còn đúng 1px và có đoạn đứt sau nearest, sắc nhưng mảnh hơn chuẩn Thanh Liên v7. Không giấu hạn chế này bằng ảnh phóng lớn. |
| Uy lực và tách mốc | 3,5 | K4 rộng hơn k2, tâm trắng hồng rõ, không có cột lửa. Tuy nhiên độ dày mép và đà bung chưa tạo cảm giác áp bức bằng Thanh Liên v7; cần duyệt hình trước hoạt hình. |

Đã xem cạnh chuẩn Thanh Liên td v7: bản chuẩn có khối lửa đặc và dày hơn; VL1 cố ý rỗng để khác chất nhưng cần tăng độ chắc các cụm mép. Đây là tự chấm, không phải người dùng đã nghiệm thu.

## Biên bản yêu cầu
| Yêu cầu | Kết quả |
|---|---|
| DESIGN đủ ý tưởng/giây/lớp/màu/cơ chế alpha/lý do | Có, DESIGN.md |
| Imagegen gốc 5 mốc + cận cảnh | Có, 4 bản gốc sáu ô, 6 crop nguyên pixel từ bản chọn |
| Góc 30° và ellipse khoảng 0,5 xuyên mọi mốc | **Chưa trọn: k2/k4/k5 còn dẹt; hết ba vòng sinh lại** |
| 5 keys cỡ game, màu, alpha, không clip | Đã chạy kiểm toàn bộ 5/5, xem cả 1× và 3× |
| Sheet gốc / lượng tử 3×, nhãn ngoài hình | Có, sheet.png |
| Prompt nguyên văn, tự chấm, kế hoạch 90 khung/3 lớp | Có trong tài liệu này |

Kết luận vòng 1: **partial**, không gọi toàn bộ brief đạt chỉ vì validator cấu trúc PASS. Phần còn thiếu là phối cảnh đồng nhất ở ảnh sinh, và độ chắc của nét ở cỡ thật còn cần duyệt. Dừng sinh đúng giới hạn; không có việc nền còn chạy. Chưa làm 90 khung hay runtime, đúng phạm vi vòng 1.

Sau tự rà, lượng tử dùng tập con 10 màu trung tính/hồng từ bảng hợp lệ (8 màu mới + trắng và #14161c có sẵn), tránh ánh xanh/vàng do nền khoá màu. Đây là nearest không dither; palette.json ghi cả bảng hợp lệ và tập ứng viên. Ảnh gốc bên trái giữ nguyên màu nguồn sau tách nền, nên có thể còn viền nhiễm màu nhẹ; bên phải là bản ứng dụng bảng đã chọn.

## Prompt nguyên văn
Các khối dưới đây được chép từ đúng bốn tệp prompt đã gửi cho công cụ, không viết lại sau khi xem kết quả.

### prompt-01.txt

`	ext
Use case: stylized-concept.
Asset type: a polished pixel-art game VFX concept contact sheet, FIVE sequential keyframes and ONE macro detail in an exact 3 columns x 2 rows grid, equal square cells. No text, numbers, borders, labels, UI or watermark.
Original design: VAN LAC TAM VIEM, "The Hollow Heart Furnace". Invisible fire that burns a victim from INSIDE; a tiny hot rose-white irregular flame kernel inside the chest, NOT a heart icon. Hollow, nearly colourless flame sheets suck INWARD toward this core, then burst OUTWARD in a broad low horizontal shockwave. No snakes, dragons, horns, lotus, crystals, conventional solid red fire, beam, vertical fire pillar or magic writing.
Composition LOCK: camera is an orthographic TOP-DOWN THREE-QUARTER GAME CAMERA, looking down enough to clearly see the TOP of the head, BOTH shoulders and robe upper planes. Character faces SOUTH-EAST, never toward viewer. Ground circles are flat ellipses 2:1 width:height (30 degree elevation). No horizon. EXACT same central target in first five cells: generic small blue-grey robed victim, black hair topknot, arms resting at sides, standing still, body height 130 pixels in each 512-pixel cell, feet at x256 y315. Do not use any supplied sprite itself. Target fully inside FX, not caster, no other character.
View first five cells as 240x220 game frames enlarged. Big confident pixel clusters, crisp stair-step outlines, lovingly crafted 16-bit fantasy action RPG art with clear negative space. Effects mostly empty interior, thin ivory/grey-lilac flame edges, occasional rose inner seams, brightest rose-white core only in chest. Restrained speck count, no fog, bloom, gradients or blur. Transparent background, real cutout, not a checkerboard image. If ground needed only the elliptical spell marks, no environment tile or backdrop.
Frame 1 top-left, 0.20s: tiny crooked rose ember IGNITES INSIDE victim's chest, 2 hairline rose cracks follow the robe; thin broken ellipse around feet width190 height95 px; three wisps lean inward. Readable quiet anticipation.
Frame 2 top-middle, 0.85s: hollow furnace fully wraps victim in THREE large asymmetrical curling glass-flame lamellae. They rise only a little above head, broad at lower outer edges then taper inward toward chest. These are organic FIRE TONGUES, not wings or crystal shards. Gaps between lamellae at least 20 pixels; front tongue crosses lower torso, back tongue visibly behind shoulders. Fire is 80 percent empty cutout; paired grey and ivory edges with tiny rose seams. Chest core bright. Ground footprint ellipse width300 height150.
Frame 3 top-right, 1.65s: furnace COMPRESSES tightly toward the chest. Chest core now 30 pixels wide, irregular jagged flame inside body, thin branching rose lines spread under robe from chest to shoulders and knees. A narrow transparent flame curl above each shoulder and one before knees, show pressure accumulating INSIDE. Broken elliptical ripple width240 height120 on ground. No skull, no gore, no anatomical heart.
Frame 4 bottom-left, 2.40s: EXPLOSIVE release from chest, 10 broad curved hollow glass-fire tongues flare RADIALLY OUTWARD low across ground. Massive flattened ellipse width430 height215, clear top surfaces visible, strong foreshortening. The BACK arc passes behind victim, front arc overlaps legs, character still visible at centre. White-lilac shell EDGES and vivid rose-white inner chest burst, tiny hot-pink tips. No tall vertical plume. Most powerful beautiful frame, spacious curves, dynamic broken contour, no spiky lotus or symmetric flower.
Frame 5 bottom-middle, 2.85s: shock ring almost gone, a few curled glass scraps at floor, faint broken elliptical footprint; victim remains standing, ONE tiny rose ember deep in chest is the last thing lit. Almost clean frame. No growing effects.
Cell 6 bottom-right: MACRO DETAIL of one hollow flame lamella curling inward beside upper torso, seen FROM ABOVE same camera; demonstrate thick confident pixel clusters, rose ember seen inside chest, ivory outer rim and cool grey inner rim, huge empty cutout between. No face closeup.
Colour family: #140c12 #4a1428 #a8204a #ff4f7a #ffb3c6 #efe9ee #ffffff #b9b3c4. Target desaturated blue-grey and charcoal. Keep these colour families, eight effect colours maximum. This is an original GAME SPRITE CONCEPT, not a painting, every frame perfectly separated within its cell.
`

### prompt-02.txt

`	ext
Edit the supplied concept sheet, keep the original Hollow Heart Furnace design and beautiful inward curling ivory/pink flame edges. Correct ONLY game proportions, cutout, and framing, all 6 equal square cells in the same 3x2 layout.

CRITICAL SCALE: in each of first five 512x512 cells, REDRAW the blue-grey standing victim only 132 pixels high TOTAL from topknot to boots, exactly HALF its current apparent height. Keep the FIRE EFFECTS large, NOT reduced with the victim. Feet at cell (256,330); head at (256,198). This is a small ~57px game character in a 220px-high frame. Character faces southeast, visible crown of head and shoulder TOP planes, top-down orthographic camera 30 degrees above ground, no frontal face. Same victim fixed in place in all five panels; no hands casting.
FRAMING: keep all fire inside each cell with at least 34px margin on EVERY side. Explosion bottom-left cell is a broad horizontal ring 420px wide and 210px deep, centered around small victim at feet. The rim must NOT run into adjacent cells or outside image. Other fire at panel 2 about 320px wide and 310px tall, not a towering column. Clearly see BACK sheets behind victim and FRONT sheets over legs.
TRUE TRANSPARENCY: remove ALL mist, gaussian glow, haze, gradients, background, atmospheric cloud and translucent veil. Transparent RGBA background. Every flame body is 80 percent EMPTY transparent hole, only narrow grey-lilac and ivory contour ribbons, a few rose seams and jagged flickering tips. Opaque crisp pixels on edges. Keep the chest ember solid hot pink-white but SMALL. No translucent fill, no dither, no blurry glow. Invisible fire means sparse CURVED CONTOURS, not bright white solid crescents.
TIMELINE unchanged: top-left .20 quiet chest ember plus tiny wisps and broken ground ellipse; top-middle .85 three generous hollow curling flame lamellae around small victim drawing INTO chest; top-right 1.65 inward tight fire, burning pink veins across chest robe, larger irregular core; bottom-left 2.40 explosive radial low horizontal release, 10 open flame tongues, most powerful; bottom-middle 2.85 tiny chest ember, 2-3 remaining floor scraps, nearly empty. Sixth cell bottom-right is MACRO DETAIL of chest and a single organic hollow flame edge, obvious blocky pixel clusters.
GROUND ELLIPSES: all projected ground rings 2:1 width:height, height exactly HALF width; floor must read top-down, no horizon. Redraw broken ground ring behind and before feet accordingly. Camera identical across cells.
Palette family stays #140c12 #4a1428 #a8204a #ff4f7a #ffb3c6 #b9b3c4 #efe9ee #ffffff; target muted charcoal and slate. Rich expressive pixel-art clusters, original elegant curved forms. No text, labels, frames, checkerboard pattern, dragons, serpents, lotus, horns, crystals, tall flame pillars, heart icons or glow.
`

### prompt-03.txt

`	ext
Edit this six-cell pixel-art concept sheet. Preserve its composition, sequence, inward glass-flame forms, stationary small grey-robed victim and visible top of head. Make the following production corrections:

1. Replace ALL white/grey background, hazy shadow, bloom and atmospheric fill with one perfectly FLAT CHROMA GREEN #00ff00. Use an OPAQUE green background, NOT transparent. Green occupies all empty space INCLUDING the hollow interiors of every flame tongue. No green light on subjects, no spill, no green FX. Make it trivial to chroma-key every empty space. Keep grey/lilac edges, pink veins and white core of artwork, no semitransparent overlays. Each organic flame tongue consists of two narrow, slightly broken ivory and lilac contour strokes, NOT a wide grey solid crescent. Most of its inside must be open GREEN NEGATIVE SPACE. Make contours flicker like FIRE rather than sharp metal blades.

2. Fix ground perspective: every ground ring is a horizontal ellipse whose height is HALF its width, 2:1 ratio. This is a GAME viewed from ABOVE at 30 degree elevation, clearly visible upper head, shoulders, back arc behind feet, front arc below feet. The ground is NOT nearly edge-on. Character faces lower-right; no portrait face.

3. Consistent first-five-cell character placement and scale: victim head to boots is about 160 pixels in a 512px cell, boots near (256,330), topknot near (256,170). Fire scale unchanged, much wider than character. No caster gesture. In bottom-left keep ALL flame tips inside the cell, no clipping; effects max width430px, height230px. Strong low horizontal burst coming from the chest, arms still down. In top-middle the 3 hollow curving flame tongues pass behind upper shoulders and before knees, with BIG open gaps.

4. Maintain exact 3 columns by 2 rows six equal square cells, no visible gutters or dividing lines. Top row: quiet internal ember / full hollow furnace / inward pressure with chest veins. Bottom row: explosive outward flattened ring / almost clean residue / MACRO DETAIL of the inward glass fire beside chest. One chest ember, irregular flame shape, no heart symbol. Frame 1 quiet, frame 5 almost empty. No white background, no blur, no noise specks, no text, no labels, no lotus, serpent, dragon, crystal, halo or vertical beam. Crisp well-designed large pixel clusters. Palette effect colours only ivory, grey-lilac and rose, target dark slate. Background ONLY uniform pure green.
`

### prompt-04.txt

`	ext
Final production correction to this exact green-background six-panel sheet. Preserve all hollow flame contours, palette, consistent character scale, chest source and five story moments. Keep the sixth macro close-up.

THE FLOOR ELLIPSES ARE STILL TOO EDGE-ON. Redraw them significantly ROUNDER, much deeper vertically. Their vertical diameter must be EXACTLY one HALF horizontal diameter, 0.50, not the current 0.3. The target is a 30-degree elevated TOP-DOWN camera, not a side-view effect. In each 512x512 cell, floor ellipse centre should be at (256,365). Desired outer bounding rectangles in cell-local coordinates:
top-left ring x144 to368, y309 to421, width224 height112;
top-middle ring x112 to400, y293 to437, width288 height144;
top-right ring x144 to368, y309 to421, width224 height112;
bottom-left explosion's low ground ring x40 to472, y257 to473, width432 height216;
bottom-middle residual ring x112 to400, y293 to437, width288 height144.
Do not render these coordinates or any text. These are invisible construction guidelines, not drawn boxes. Use broken organic elliptical contours, some hidden behind the target, front arc clearly below boots. Keep FULL 2:1 ellipses within cells. The explosion's actual fire tongues also form this rounder projected ground ring, all fan OUTWARD from chest but low to ground, back tongues noticeably foreshortened and hidden behind victim. No vertical pillar. All visible fire in each cell must have 25px margins from cell edges.

Camera emphasis: turn victim about 25 degrees toward the viewer's RIGHT so face points lower-right and we see the top of hair bun and both shoulder upper planes, not a frontal portrait. Same stance and scale all five cells. Keep the victim standing centrally with arms at sides, no caster.
Background stays FLAT PURE CHROMA GREEN #00ff00 everywhere, including hollow flame interiors, NO mist or shadow, no green spill. No texture, gradients or bloom. Pixel-art clean edges. No text, numbers, labels, grid lines or watermarks.
`

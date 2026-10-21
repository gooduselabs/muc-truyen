/** Original sample stories written for Mực (MIT). Paragraphs are separated by blank lines. */
export interface SeedStory {
  title: string; author: string; genre: string; tags: string[]; ageRating: 'ALL' | 'T13' | 'T16' | 'T18';
  status: 'ONGOING' | 'COMPLETED'; waitFreeHours?: number; synopsis: string; chapters: { title: string; price?: number; text: string }[];
}

export const STORIES: SeedStory[] = [
  {
    title: 'Người Gác Đèn Ở Cù Lao Mây', author: 'linhan', genre: 'Huyền huyễn', tags: ['biển', 'cổ tích', 'chữa lành', 'nam bộ'],
    ageRating: 'ALL', status: 'ONGOING', waitFreeHours: 24,
    synopsis: 'Cù Lao Mây chỉ hiện ra khi sương xuống. Mười bảy tuổi, Thơm nhận chiếc chìa khoá ngọn hải đăng từ người ông vừa mất, cùng lời dặn kỳ lạ: "Đừng để đèn tắt vào đêm không trăng." Cô không biết rằng thứ ánh sáng ấy đang giữ cho cả một thế giới khỏi trôi đi.',
    chapters: [
      { title: 'Chiếc chìa khoá bằng đồng', text: `Sáng hôm ông Tư mất, sương phủ dày tới mức Thơm không thấy được mũi xuồng của chính mình.

Người trong xóm chài nói ông đi êm, như ngọn đèn hết dầu. Nhưng Thơm biết ông không êm chút nào. Đêm cuối, ông nắm tay cô chặt tới mức các khớp ngón tay trắng bệch, miệng lặp đi lặp lại một câu: "Đêm không trăng, con nhớ."

Chiếc chìa khoá ông để lại nặng hơn vẻ ngoài của nó. Đồng đã xỉn màu, phần tay cầm khắc hình một con cá có ba con mắt.

"Chìa của cái hải đăng ngoài cù lao," bà Sáu bán cá nói, giọng nhỏ như sợ ai nghe. "Mà cù lao đó đâu phải lúc nào cũng có."

Thơm đã nghe chuyện này từ nhỏ. Cù Lao Mây chỉ hiện ra trên mặt sông khi sương xuống đủ dày, và biến mất khi mặt trời lên quá ngọn dừa. Người lớn dùng nó để doạ con nít đừng chèo xuồng một mình. Cô chưa bao giờ tin.

Cho tới khi, sáng hôm đó, giữa màn sương trắng đục, cô thấy một đốm sáng vàng nhấp nháy ở phía mà lẽ ra chỉ có nước.

***

Cô chèo ra trước khi kịp nghĩ. Mái chèo khua xuống nước mà không nghe tiếng. Gió cũng im. Cả dòng sông như nín thở.

Ngọn hải đăng hiện ra cao hơn cô tưởng, thân quét vôi trắng đã bong từng mảng, cửa gỗ sơn xanh khép hờ. Trên bậc thềm có một đôi dép tổ ong của ông, xếp ngay ngắn như ông chỉ vừa bước vào trong.

Thơm tra chìa vào ổ. Nó xoay nhẹ như thể đã chờ cô từ rất lâu.` },
      { title: 'Những người không có bóng', text: `Bên trong hải đăng có mùi dầu hôi và mùi giấy cũ.

Cầu thang xoắn ốc chạy dọc thân tháp, mỗi bậc đều được đánh số bằng sơn đỏ. Thơm đếm tới bậc một trăm lẻ tám thì gặp căn phòng đèn: một chiếc đèn dầu khổng lồ đặt giữa vòng thấu kính, ngọn lửa nhỏ như hạt đậu.

"Cô tới trễ ba ngày."

Thơm giật mình quay lại. Một cậu con trai ngồi vắt vẻo trên lan can, chân đung đưa ra ngoài khoảng không. Cậu mặc áo bà ba đã sờn vai, tóc ướt như vừa lặn dưới sông lên.

Và dưới chân cậu, trên sàn gỗ đầy nắng, không có cái bóng nào.

"Ông Tư hứa sẽ gửi người thay," cậu nói tiếp, như thể chuyện không có bóng là điều hiển nhiên nhất đời. "Tôi là Lộc. Tôi giữ sổ."

"Sổ gì?"

Lộc chỉ về phía chiếc bàn kê sát cửa sổ. Trên đó là một quyển sổ bìa vải, dày cộm, trang nào cũng kín chữ. Thơm lật thử một trang. Tên người, ngày tháng, và một dòng ghi chú: "Đã qua sông bình an."

"Những người đi lạc trong sương," Lộc nói. "Đèn còn sáng thì họ còn thấy đường về."` },
      { title: 'Đêm không trăng thứ nhất', price: 5, text: `Lịch âm treo trong bếp nhà Thơm có một ngày được khoanh mực đỏ. Ba mươi tháng Chín. Đêm không trăng.

Lộc dạy cô cách châm dầu, cách cắt bấc, cách lau thấu kính bằng giẻ thấm rượu gạo. "Ánh sáng phải sạch," cậu nói. "Người lạc đường không cần đèn sáng nhất. Họ cần đèn thật nhất."

Thơm không hiểu câu đó cho tới khi đêm xuống.

Sương dâng lên từ mặt sông như sữa tràn. Rồi từ trong sương, từng người một bước ra: một bà cụ ôm thúng bánh, một người lính mặc quân phục cũ, một đứa bé cầm lồng đèn ông sao đã tắt. Họ không đi trên nước. Họ đi trên những vệt sáng mà ngọn đèn hắt xuống.

Và rồi gió nổi lên. Ngọn lửa chao đảo.

"Giữ tay ở đây," Lộc hét, đặt bàn tay lạnh ngắt của cậu lên tay cô, cả hai cùng che quanh ống khói thuỷ tinh. "Đừng nhìn xuống. Nhìn vào lửa thôi."

Thơm nhìn vào lửa. Trong ngọn lửa, cô thấy ông Tư đang mỉm cười.` },
      { title: 'Người lính trở về', price: 5, text: `Người lính tên là Hoà, và anh đã đi lạc bốn mươi chín năm.

Anh kể chuyện đó bằng giọng bình thản của người đã quen với chờ đợi. Đơn vị anh hành quân qua một khúc sông vào đêm không trăng. Sương lên. Khi sương tan, cả trung đội đã sang bờ bên kia, chỉ còn anh đứng giữa một dòng nước không chảy.

"Ông Tư là người đầu tiên thấy tôi," Hoà nói, xoay chiếc mũ tai bèo trong tay. "Ông bảo tôi chờ. Bảo rằng sẽ có một đêm đèn đủ sáng."

Thơm lật quyển sổ. Ở trang cuối cùng có nét chữ run run của ông cô: "Hoà. Chưa qua. Nhớ."

Cô cầm bút. Tay cô run không kém gì ông ngày trước.

"Anh còn ai đang chờ không?" cô hỏi.

Hoà im lặng rất lâu. "Má tôi. Chắc không còn nữa đâu. Nhưng tôi muốn về thắp cho bà nén nhang."` },
      { title: 'Chuyện Lộc không kể', price: 6, text: `Có những câu hỏi Thơm để dành rất lâu mới dám hỏi. Câu đầu tiên là: "Sao cậu không có bóng?"

Lộc đang lau thấu kính. Tay cậu dừng lại một nhịp rồi tiếp tục, đều đặn, từng vòng tròn nhỏ.

"Vì tôi chưa bao giờ rời khỏi ánh đèn," cậu nói. "Bóng chỉ có ở những chỗ ánh sáng không với tới."

Câu trả lời đẹp tới mức Thơm biết ngay là nó không thật.

Đêm đó, cô lén đọc những trang đầu tiên của quyển sổ, những trang có giấy vàng như lá chuối khô. Ở dòng đầu tiên, nét chữ không phải của ông cô. Nét chữ nghiêng, mảnh, rất giống chữ Lộc vẫn viết.

"Lộc. Mười sáu tuổi. Tự nguyện ở lại giữ đèn."` },
    ],
  },
  {
    title: 'Kiếm Khách Phố Hàng Bạc', author: 'quanghuy', genre: 'Kiếm hiệp', tags: ['hà nội xưa', 'võ hiệp', 'báo thù', 'hành động'],
    ageRating: 'T13', status: 'ONGOING', waitFreeHours: 48,
    synopsis: 'Kinh thành Thăng Long, năm Cảnh Hưng thứ ba mươi. Một thợ chạm bạc câm lặng, một thanh kiếm giấu trong ống tre, và món nợ máu mười năm chưa trả. Khi tiệm bạc cuối phố bốc cháy, cả kinh thành mới biết người thợ hiền lành ấy từng là đệ nhất kiếm của Đông Ngạn phái.',
    chapters: [
      { title: 'Tiệm bạc cuối phố', text: `Mỗi sáng, khi tiếng mõ ở chùa Kim Cổ vừa dứt, Bùi Tĩnh lại mở cửa tiệm.

Tiệm nhỏ, chỉ đủ kê một chiếc bàn gỗ lim và một lò than. Khách tới đặt vòng bạc cho con trẻ, đặt trâm cài cho cô dâu mới. Tĩnh không nói, chỉ gật đầu và đưa giá bằng ngón tay. Người trong phố gọi anh là "anh câm", gọi một cách thương, như gọi một món đồ cũ quen tay.

Không ai để ý đôi tay của anh. Đôi tay cầm chiếc đục nhỏ như cầm sợi tóc, chạm hoa văn lên bạc mỏng mà không một nét nào chệch. Đôi tay ấy, mười năm trước, từng cầm một thứ khác.

Thứ đó giờ nằm trong ống tre treo trên xà nhà, phủ bụi, quấn ba lớp vải điều.

Sáng nay, có một người khách lạ. Hắn đội nón dứa, áo dài the đen, và đôi giày vải không dính một hạt bụi đường dù trời vừa mưa.

"Tôi cần chạm một chữ," hắn nói, đặt lên bàn một miếng bạc hình lá liễu. "Chữ Tĩnh."

Bùi Tĩnh nhìn miếng bạc. Rồi anh nhìn lên mái nhà, nơi ống tre đang khẽ đung đưa dù không có gió.` },
      { title: 'Mười năm trước, Đông Ngạn', text: `Đông Ngạn phái không lớn. Mười hai đệ tử, một sư phụ, một sân tập lát gạch Bát Tràng đã mòn vẹt.

Tĩnh là đệ tử út, vào phái năm chín tuổi vì nhà nghèo. Sư phụ không dạy cậu kiếm trong ba năm đầu. Ông bắt cậu gánh nước, bổ củi, và mỗi tối ngồi chạm bạc dưới ngọn đèn dầu lạc.

"Kiếm và đục giống nhau," ông nói. "Đều là bỏ đi những phần thừa."

Năm mười chín tuổi, Tĩnh đánh bại cả mười một sư huynh trong một buổi chiều. Năm hai mươi, cậu đứng thứ nhất ở hội kiếm Thăng Long. Năm hai mươi mốt, Đông Ngạn phái bị đốt trụi trong một đêm, và cậu là người duy nhất sống sót.

Kẻ đốt phái đeo một miếng bạc hình lá liễu.

Tĩnh đã tự tay chạm miếng bạc ấy, một tháng trước đêm cháy, cho một vị khách đội nón dứa.` },
      { title: 'Lửa ở phố Hàng Bạc', price: 4, text: `Tiệm bạc cháy vào giờ Tý.

Tĩnh không ngủ. Anh ngồi trong bóng tối, ống tre đặt ngang đùi, nghe tiếng chân trên mái ngói. Bảy người. Bước chân nhẹ của dân luyện khinh công, nhưng có một người đi nặng hơn bên trái, chắc từng bị thương ở gối.

Mồi lửa rơi xuống qua lỗ thông gió. Tĩnh không dập. Anh để nó cháy, vì ánh lửa sẽ làm loá mắt những kẻ quen bóng đêm.

Rồi anh tháo lớp vải điều thứ nhất.

Phố Hàng Bạc đêm đó, người ta kể lại, có tiếng sắt chạm nhau như mưa đá rơi trên mái tôn. Có bảy bóng đen ngã xuống, không ai chết, nhưng không ai còn cầm được kiếm. Và có một người đàn ông đứng giữa đám cháy, tay cầm một thanh kiếm mỏng như lá lúa, sáng như bạc vừa đánh.

Sáng hôm sau, tiệm bạc cuối phố chỉ còn tro. Anh câm biến mất.` },
      { title: 'Cô gái bán chè ở Ô Quan Chưởng', price: 4, text: `Lan bán chè đỗ đen ở cửa Ô Quan Chưởng đã ba năm. Ba năm, cô thấy đủ loại người qua cửa ô: lái buôn, học trò lên kinh ứng thí, lính tuần, ăn mày. Cô học cách nhìn người qua đôi giày.

Người đàn ông ngồi xuống chiếc ghế đẩu nhà cô sáng hôm đó đi đôi giày cỏ mới bện, nhưng gót chân lại có vết chai của người quen đứng tấn.

"Một bát chè," anh ra hiệu bằng tay.

Lan múc chè, rồi khẽ nói, không nhìn anh: "Có người đang tìm một anh thợ bạc không biết nói. Họ treo thưởng năm mươi lạng."

Tĩnh ngẩng lên.

"Đừng lo," Lan cười, đặt bát chè xuống. "Tôi không biết anh thợ bạc nào cả. Tôi chỉ biết anh là khách ăn chè, và chè nhà tôi thì không bán cho bọn đeo lá liễu."` },
    ],
  },
  {
    title: 'Mùa Hạ Năm Ấy Có Cậu', author: 'linhan', genre: 'Học đường', tags: ['thanh xuân', 'đà lạt', 'tình đầu', 'chữa lành'],
    ageRating: 'ALL', status: 'COMPLETED',
    synopsis: 'Lớp 12A3 có một quy tắc ngầm: không ai ngồi bàn cuối dãy cửa sổ. Cho tới khi cậu học sinh chuyển trường từ Sài Gòn lên Đà Lạt, mang theo chiếc máy ảnh phim và một bí mật về mùa hạ năm mười lăm tuổi.',
    chapters: [
      { title: 'Bàn cuối dãy cửa sổ', text: `Đà Lạt tháng Chín, mưa chiều nào cũng tới đúng giờ như một học sinh gương mẫu.

Vy ngồi bàn ba, đủ gần bảng để chép bài, đủ xa để không bị gọi lên. Cô đã chọn chỗ đó từ năm lớp mười và chưa bao giờ đổi.

Hôm khai giảng, cô chủ nhiệm dẫn vào một cậu con trai cao lêu nghêu, áo khoác dù màu xanh rêu, cổ đeo một chiếc máy ảnh phim cũ. "Đây là Minh, chuyển từ Sài Gòn lên. Em tự chọn chỗ đi."

Cả lớp im phăng phắc khi Minh đi thẳng xuống bàn cuối dãy cửa sổ.

Không ai nói với cậu rằng chỗ đó từng là của Khoa. Không ai nói rằng từ mùa hạ năm ngoái, chiếc bàn ấy vẫn để trống, và mỗi sáng thứ Hai lại có ai đó đặt lên một nhành dã quỳ.

Minh nhặt nhành hoa lên, nhìn nó một lúc, rồi cẩn thận cài vào khe cửa sổ.

Vy không biết vì sao, nhưng cô thấy mắt mình cay.` },
      { title: 'Cuộn phim chưa rửa', text: `"Cậu có biết chỗ nào còn rửa phim không?"

Đó là câu đầu tiên Minh nói với Vy, ba tuần sau ngày khai giảng, ở nhà xe trường lúc trời mưa tầm tã.

"Chú Bảy ở dốc Nhà Làng," Vy đáp. "Nhưng chú hay đóng cửa đi câu."

Họ cùng đạp xe tới dốc Nhà Làng. Tiệm đóng cửa. Họ ngồi dưới mái hiên, nhìn mưa, và Minh kể về cuộn phim.

Nó được chụp vào mùa hạ năm cậu mười lăm tuổi, ở một thị trấn biển mà cậu không muốn nhắc tên. Ba mươi sáu kiểu. Cậu chưa bao giờ dám đem đi rửa.

"Sợ gì?" Vy hỏi.

"Sợ là trong đó có người mà mình đã quên mặt," Minh nói. "Hoặc tệ hơn, sợ là mình vẫn nhớ."` },
      { title: 'Ba mươi sáu kiểu', text: `Chú Bảy rửa phim trong phòng tối suốt một buổi chiều.

Khi chú đưa xấp ảnh ra, còn ướt mùi hoá chất, Minh không cầm. Cậu đẩy nó sang phía Vy.

Biển. Một cậu con trai gầy nhom cười toe với hàm răng thiếu một chiếc. Lại biển. Hai đứa nhóc ngồi trên mũi thuyền thúng. Một chiếc diều hình con cá. Biển lúc hoàng hôn.

Kiểu cuối cùng chụp lệch, mờ nhoè, như thể người cầm máy đang chạy. Trong ảnh chỉ có mặt nước và một chiếc dép tổ ong trôi.

"Đó là Toàn," Minh nói khẽ. "Bạn thân nhất của tớ. Mùa hạ năm đó, cậu ấy bơi ra xa quá."

Ngoài trời, mưa Đà Lạt đã tạnh. Vy đặt xấp ảnh xuống, và lần đầu tiên, cô nắm tay một người mà không cần nghĩ gì cả.` },
      { title: 'Dã quỳ tháng Mười Một (Hết)', text: `Tháng Mười Một, dã quỳ nở vàng hai bên đường lên đồi Cù.

Sáng thứ Hai cuối cùng của học kỳ, Vy tới lớp sớm hơn thường lệ. Trên bàn cuối dãy cửa sổ có hai nhành dã quỳ, và một tấm ảnh đen trắng: hai cậu bé trên mũi thuyền thúng, cười toe.

Mặt sau tấm ảnh có dòng chữ: "Gửi Khoa, từ một người cũng từng mất một người bạn. Cậu ấy chắc sẽ vui vì chỗ ngồi này lại có người."

Cả lớp đứng lặng rất lâu.

Rồi Duy, lớp trưởng, người thân với Khoa nhất, bước tới, nhặt tấm ảnh lên, và lần đầu tiên trong suốt một năm, cậu khóc thành tiếng.

Mùa hạ năm ấy có cậu. Mùa đông năm nay có chúng mình. Vy viết câu đó vào trang cuối quyển lưu bút, và để dành chỗ trống bên cạnh cho một tấm ảnh chưa chụp.` },
    ],
  },
  {
    title: 'Hồ Sơ Mật Chung Cư 404', author: 'thaonguyen', genre: 'Trinh thám', tags: ['sài gòn', 'phá án', 'bí ẩn', 'chung cư'],
    ageRating: 'T16', status: 'ONGOING', waitFreeHours: 24,
    synopsis: 'Chung cư cũ quận Ba có một căn hộ số 404 mà không ai nhớ đã từng có người ở. Khi một shipper giao đơn hàng tới đúng căn ấy và mất tích, nữ thám tử tư Hạ Vy buộc phải mở lại hồ sơ mà cha cô bỏ dở hai mươi năm trước.',
    chapters: [
      { title: 'Đơn hàng lúc nửa đêm', text: `Đơn hàng cuối cùng của Tâm trong ngày là một hộp cơm tấm sườn bì chả, giao tới chung cư Lý Thường Kiệt, lô B, phòng 404.

Hệ thống ghi nhận anh tới nơi lúc 23:47. Đồng hồ thông minh ghi nhận nhịp tim anh tăng lên 142 lúc 23:49. Sau đó, không còn gì nữa.

Ba ngày sau, Hạ Vy đứng trước cửa phòng 404 với một chùm chìa khoá xin được từ ban quản lý và một linh cảm rất xấu.

"Phòng này bỏ trống từ trước năm hai ngàn," bà tổ trưởng dân phố nói, tay lần tràng hạt. "Chủ cũ đi nước ngoài, không ai ở. Cô coi chừng, mấy đứa nhỏ trong xóm nói ban đêm nghe có tiếng radio."

Vy tra chìa vào ổ. Ổ khoá mới tinh, không một vết gỉ.

Bên trong, trên chiếc bàn ăn phủ bụi dày một đốt ngón tay, có một hộp cơm tấm còn nguyên, chưa mở nắp. Và một tờ giấy ghi chú màu vàng, nét chữ mà Vy nhận ra ngay lập tức.

Nét chữ của cha cô. Người đã mất hai mươi năm.` },
      { title: 'Cuộn băng cassette', text: `Cha của Vy là đại uý Hạ Phong, đội trọng án công an thành phố. Năm 2004, ông xin nghỉ hưu sớm không rõ lý do. Năm 2006, ông mất vì một cơn đau tim trong lúc đang ngồi câu cá ở Cần Giờ.

Tờ giấy trong phòng 404 chỉ có một dòng: "Băng số 7. Mặt B."

Vy lục lại hộp đồ cũ của cha trong kho. Có mười hai cuộn băng cassette, dán nhãn bằng băng keo giấy. Cuộn số bảy bị thiếu.

Cô ngồi bệt xuống sàn kho, giữa mùi long não và giấy mục, và nhận ra một điều khiến sống lưng lạnh toát: không phải cuộn băng bị mất. Cái hộp được thiết kế để đựng mười một cuộn. Cha cô đã cố tình làm thêm một ngăn.

Ai đó đã lấy cuộn băng ra. Và người đó biết cô sẽ tìm.` },
      { title: 'Người hàng xóm phòng 403', price: 5, text: `Ông Khải ở phòng 403 đã ngoài bảy mươi, nói chuyện chậm rãi, pha trà bằng bộ ấm Bát Tràng sứt quai.

"Tôi ở đây từ năm tám mươi lăm," ông nói. "Phòng bên cạnh, tôi chưa từng thấy ai ra vào. Nhưng radio thì có thật. Đêm nào trời mưa cũng nghe. Toàn nhạc Trịnh."

"Ông có báo công an chưa?"

Ông Khải cười, một nụ cười mệt mỏi. "Báo rồi chứ. Năm 2003. Có một anh đại uý tới, ở lại nghe suốt một đêm. Sáng ra anh ấy hỏi tôi một câu kỳ lạ lắm."

Vy nín thở. "Câu gì ạ?"

"Anh ấy hỏi: Bác có chắc là tiếng radio phát ra từ bên kia bức tường, chứ không phải từ bên này không?"` },
    ],
  },
  {
    title: 'Trạm Cuối Sao Hỏa', author: 'quanghuy', genre: 'Khoa học viễn tưởng', tags: ['vũ trụ', 'sinh tồn', 'trí tuệ nhân tạo', 'tương lai'],
    ageRating: 'T13', status: 'ONGOING',
    synopsis: 'Năm 2187, trạm nghiên cứu Lạc Hồng trên Sao Hỏa mất liên lạc với Trái Đất. Kỹ sư trẻ nhất trạm, Phạm Đăng Khôi, tỉnh dậy sau giấc ngủ đông và phát hiện mình là người duy nhất còn sống, cùng một trí tuệ nhân tạo nói giọng miền Tây.',
    chapters: [
      { title: 'Tỉnh giấc', text: `Thứ đầu tiên Khôi nghe thấy khi tỉnh dậy là một câu vọng cổ.

"Dạ thưa anh Khôi, anh tỉnh rồi hả? Anh nằm yên chút xíu nghen, máu anh còn lạnh lắm."

Giọng nói phát ra từ khắp nơi và không từ đâu cả. Khôi cố mở mắt. Trần buồng ngủ đông phủ một lớp sương giá mỏng, đèn khẩn cấp nhấp nháy màu cam.

"Ai... đó?"

"Dạ, em là Út, trí tuệ quản lý trạm Lạc Hồng. Anh Khôi ngủ đông hai trăm mười bốn ngày, lâu hơn dự kiến một trăm tám mươi ngày. Em xin lỗi anh, em đánh thức anh không được sớm hơn."

Khôi ngồi dậy. Cơ bắp rã rời như bị ai rút hết xương. "Những người khác đâu? Chị Thuỷ? Anh Bảo?"

Út im lặng. Trong hai năm làm việc với hệ thống này, Khôi chưa bao giờ nghe Út im lặng.

"Dạ," cuối cùng nó nói. "Anh mặc áo ấm vô đi anh. Em dẫn anh đi coi."` },
      { title: 'Nhà kính số ba', text: `Nhà kính số ba vẫn xanh.

Đó là điều kỳ lạ nhất. Trạm Lạc Hồng mất điện chính, mất liên lạc, mất mười một trong mười hai thành viên, nhưng những luống rau muống trong nhà kính số ba vẫn xanh mướt dưới ánh đèn tím.

"Em giữ điện cho tụi nó," Út nói. "Chị Thuỷ dặn em. Chị nói người còn sống thì phải có rau muống luộc chấm nước mắm."

Khôi bật cười, rồi tiếng cười vỡ ra thành thứ gì đó khác. Anh ngồi xuống giữa hai luống rau, ôm đầu gối, và để mình khóc lần đầu tiên kể từ khi tỉnh dậy.

Út không nói gì. Nó chỉ chỉnh nhiệt độ nhà kính lên hai độ, và mở nhỏ một bài hát mà chị Thuỷ hay nghe mỗi tối: Bông điên điển.` },
      { title: 'Tín hiệu từ Phobos', price: 3, text: `Ngày thứ chín sau khi tỉnh dậy, Út bắt được một tín hiệu.

Nó yếu, lặp lại theo chu kỳ bảy giờ ba mươi chín phút, đúng bằng chu kỳ quỹ đạo của Phobos, mặt trăng lớn của Sao Hỏa.

"Tín hiệu Morse, anh Khôi," Út nói, giọng hơi run, nếu một trí tuệ nhân tạo có thể run. "Em dịch rồi. Nó ghi: LẠC HỒNG. CÒN AI KHÔNG."

Khôi nhìn chằm chằm vào màn hình. Không có trạm nào trên Phobos. Chưa từng có.

"Út, gửi trả lời đi."

"Dạ, gửi gì anh?"

Khôi nghĩ một lúc lâu. Rồi anh nói: "Gửi: CÒN MỘT NGƯỜI. VÀ MỘT LUỐNG RAU MUỐNG."` },
    ],
  },
  {
    title: 'Thương Nhau Giữa Mùa Cà Phê', author: 'thaonguyen', genre: 'Ngôn tình', tags: ['tây nguyên', 'cà phê', 'tình yêu', 'đời thường'],
    ageRating: 'T13', status: 'ONGOING', waitFreeHours: 24,
    synopsis: 'Bỏ việc ở một tập đoàn tại Sài Gòn, An về Buôn Ma Thuột tiếp quản rẫy cà phê của bà ngoại, chỉ để phát hiện mảnh rẫy đang bị một anh kỹ sư nông nghiệp cứng đầu "chiếm đóng" vì một hợp đồng thuê mà bà quên kể.',
    chapters: [
      { title: 'Hợp đồng bà quên kể', text: `An về tới rẫy lúc chiều muộn, khi nắng đã ngả màu mật ong.

Căn nhà gỗ của bà ngoại vẫn y như trong ký ức: mái tôn đỏ gạch, hiên rộng, giàn mướp leo kín cửa sổ. Chỉ có một điều khác. Trên hiên có một người đàn ông đang ngồi phơi hạt cà phê, đội nón lá, áo sơ mi xắn tay.

"Anh là ai?"

Người đàn ông ngẩng lên, nheo mắt nhìn cô từ đầu tới chân, dừng lại lâu ở đôi giày cao gót đang lún vào đất đỏ. "Tôi là người thuê rẫy. Còn cô?"

"Tôi là chủ rẫy."

"Bà Năm cho tôi thuê ba năm, còn mười bốn tháng." Anh rút từ túi áo ra một tờ giấy gấp tư, mép đã sờn. "Có chữ ký, có điểm chỉ, có cả con dấu của xã."

An nhìn tờ giấy. Nét chữ ký run run, đúng là của bà.

"Bà tôi chưa bao giờ nói gì về chuyện này."

Lần đầu tiên, người đàn ông cười. "Bà Năm nói nhiều chuyện lắm. Chắc bà để dành chuyện này cho cô tự khám phá."` },
      { title: 'Mùa hoa cà phê', text: `Tên anh là Đạt, kỹ sư nông nghiệp, từng làm cho một công ty xuất khẩu lớn rồi bỏ về vì "chán nhìn cà phê qua bảng tính".

Anh đang thử nghiệm trồng cà phê dưới tán cây bơ, không dùng thuốc diệt cỏ. Bà ngoại An là người duy nhất trong vùng chịu cho anh thuê đất làm thử.

"Mấy ông hàng xóm nói tôi khùng," Đạt kể, tay vẫn lựa hạt. "Bà Năm thì nói: Khùng mà có lý thì cứ khùng đi con."

An bật cười. Đúng là bà ngoại cô.

Tháng Ba, cả rẫy nở hoa trắng xoá như tuyết rơi giữa cao nguyên. Mùi hoa cà phê ngọt lịm, quyện với mùi đất đỏ sau cơn mưa đầu mùa. An đứng giữa những hàng cây, quên mất rằng mình đã định bán mảnh rẫy này ngay khi hợp đồng hết hạn.` },
      { title: 'Cơn mưa đá', price: 4, text: `Cơn mưa đá tới vào một buổi chiều tháng Tư, không báo trước.

Những viên đá to bằng đầu ngón tay cái đập xuống mái tôn như ai đổ sỏi. An chạy ra hiên, thấy Đạt đang lao về phía vườn ươm, nơi mấy trăm cây con mới được hai tháng tuổi.

Cô không nghĩ. Cô chỉ chạy theo.

Họ kéo tấm bạt che, gió giật tung một góc, An ngã sõng soài trên đất đỏ. Đạt kéo cô dậy, cả hai ướt sũng, tóc dính đầy lá, tay vẫn ghì chặt mép bạt.

Khi mưa tạnh, vườn ươm còn nguyên. An nhìn xuống đôi tay mình, móng tay gãy, lòng bàn tay rướm máu, và cô cười, cười như chưa bao giờ được cười ở Sài Gòn.

"Cô điên rồi," Đạt nói, nhưng mắt anh cũng đang cười.

"Bà tôi nói," An đáp, "khùng mà có lý thì cứ khùng đi."` },
    ],
  },
  {
    title: 'Chuyện Ma Làng Gốm', author: 'linhan', genre: 'Kinh dị', tags: ['dân gian', 'làng nghề', 'tâm linh', 'bắc bộ'],
    ageRating: 'T16', status: 'COMPLETED',
    synopsis: 'Làng gốm ven sông Hồng có một lò nung bỏ hoang mà người già cấm con cháu lại gần. Một nhóm sinh viên mỹ thuật về làng thực tập, và một trong số họ đã nặn ra một bức tượng giống hệt người con gái chết trong lò nung ấy năm mươi năm trước.',
    chapters: [
      { title: 'Lò nung số chín', text: `Làng có chín lò nung. Tám lò vẫn đỏ lửa quanh năm. Lò thứ chín nằm cuối bãi bồi, mái sập một nửa, cỏ lau mọc kín cửa.

"Đừng ra đó," cụ Hiền, nghệ nhân già nhất làng, nói với nhóm sinh viên ngay buổi chiều đầu tiên. Giọng cụ không doạ, chỉ mệt. "Đất ở đó không nặn được đâu. Nặn ra cái gì, nó cũng thành người."

Cả nhóm cười. Chỉ có Ngân không cười.

Đêm đó, Ngân mơ thấy một người con gái mặc áo tứ thân màu nâu non, ngồi bên bàn xoay, đôi tay lấm bùn nặn mãi một chiếc bình không bao giờ thành hình.

Sáng ra, dưới móng tay Ngân có đất. Thứ đất màu xám bạc, mịn như phấn, không giống đất ở bất kỳ lò nào trong làng.` },
      { title: 'Bức tượng không tên (Hết)', text: `Bức tượng Ngân nặn trong lúc ngủ cao chừng một gang tay. Một cô gái ngồi xếp bằng, tóc vấn, đôi mắt khép hờ.

Cụ Hiền nhìn bức tượng rất lâu. Rồi cụ ngồi xuống, đôi vai gầy run lên.

"Cô Mận," cụ nói. "Năm bảy mươi tư. Cô ấy là thợ nặn khéo nhất làng. Đêm cuối cùng trước khi về nhà chồng, cô muốn nung xong chiếc bình cưới. Lò sập."

Nhóm sinh viên lặng đi.

"Cô ấy không hại ai đâu," cụ Hiền nói tiếp, tay chạm nhẹ vào bức tượng. "Cô chỉ muốn làm cho xong."

Tối hôm đó, cả làng nhóm lại lò số chín. Ngân ngồi bên bàn xoay suốt đêm, đôi tay không còn là của riêng cô. Gần sáng, một chiếc bình men rạn màu ngọc ra lò, hoàn hảo tới từng đường cong.

Từ đó, không ai còn mơ thấy cô gái áo nâu non nữa. Chiếc bình được đặt trong đình làng, bên dưới ghi một dòng: "Bình cưới của cô Mận. Nung năm 1974, ra lò năm 2026."` },
    ],
  },
  {
    title: 'Sổ Tay Của Một Người Viết Muộn', author: 'thaonguyen', genre: 'Thơ & Tản văn', tags: ['tản văn', 'viết lách', 'đời thường', 'chữa lành'],
    ageRating: 'ALL', status: 'ONGOING',
    synopsis: 'Những trang tản văn ngắn về việc bắt đầu viết ở tuổi bốn mươi: về những buổi sáng năm giờ, về những bản thảo bị từ chối, và về niềm vui giản dị khi có một người lạ nói rằng họ đã khóc khi đọc chữ mình.',
    chapters: [
      { title: 'Năm giờ sáng', text: `Tôi bắt đầu viết vào năm bốn mươi mốt tuổi, lúc năm giờ sáng, khi cả nhà còn ngủ.

Không có lý do gì đặc biệt. Chỉ là một buổi sáng, tôi tỉnh dậy và nhận ra mình đã đọc sách suốt ba mươi năm mà chưa từng viết trọn một trang.

Trang đầu tiên rất tệ. Trang thứ hai còn tệ hơn. Đến trang thứ mười, tôi bắt đầu hiểu rằng viết không phải là chờ cảm hứng, mà là ngồi xuống, mỗi ngày, ở cùng một chỗ, như người nông dân ra đồng.

Có những sáng tôi chỉ viết được một câu. Nhưng một câu mỗi ngày, sau một năm, là ba trăm sáu mươi lăm câu. Đủ cho một truyện ngắn. Hoặc đủ để biết mình không bỏ cuộc.` },
      { title: 'Lá thư từ chối thứ mười hai', text: `Lá thư từ chối thứ mười hai tới vào một chiều thứ Sáu.

"Cảm ơn chị đã gửi bản thảo. Rất tiếc, hiện tại tác phẩm chưa phù hợp với định hướng của chúng tôi."

Tôi đọc nó hai lần, gấp lại, kẹp vào cuốn sổ cùng mười một lá thư trước. Cuốn sổ giờ đã dày cộm, gáy không khép được nữa.

Con gái tôi, mười hai tuổi, hỏi sao mẹ không vứt mấy lá thư đó đi.

Tôi nói: "Vì một ngày nào đó, mẹ muốn đếm xem mình đã được từ chối bao nhiêu lần trước khi được nhận."

Con bé nghĩ một lúc rồi nói: "Vậy mẹ cứ viết tiếp đi. Con muốn biết con số đó là bao nhiêu."` },
    ],
  },
];

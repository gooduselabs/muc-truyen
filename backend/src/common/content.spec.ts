import { docFromText, normalizeVi, slugify, toParagraphs, wordCount } from './content';
import { authorCut, rentalPrice } from '../modules/economy';
import { VnpayProvider } from '../modules/payments';

describe('content helpers', () => {
  it('bỏ dấu tiếng Việt và tạo slug', () => {
    expect(normalizeVi('Đường Về Cù Lao')).toBe('duong ve cu lao');
    expect(slugify('Kiếm Khách Phố Hàng Bạc!')).toBe('kiem-khach-pho-hang-bac');
  });
  it('tách đoạn từ tài liệu Tiptap, giữ in đậm/nghiêng, escape HTML', () => {
    const ps = toParagraphs({
      type: 'doc', content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Xin ' }, { type: 'text', text: 'chào', marks: [{ type: 'bold' }] }] },
        { type: 'paragraph', content: [] },
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: '<script>' }] }] },
        { type: 'horizontalRule' },
      ],
    });
    expect(ps).toHaveLength(3);
    expect(ps[0].html).toBe('Xin <strong>chào</strong>');
    expect(ps[1]).toMatchObject({ type: 'quote', html: '&lt;script&gt;' });
    expect(ps[2].type).toBe('hr');
    expect(wordCount(ps)).toBe(3);
  });
  it('docFromText tách theo dòng trống', () => {
    expect(toParagraphs(docFromText('a b\n\nc\n\n***\n\nd'))).toHaveLength(4);
  });
});

describe('economy', () => {
  it('giá thuê 48h = 40% làm tròn lên, tối thiểu 1 xu', () => {
    expect(rentalPrice(0)).toBe(0);
    expect(rentalPrice(1)).toBe(1);
    expect(rentalPrice(5)).toBe(2);
    expect(rentalPrice(10)).toBe(4);
  });
  it('tác giả nhận 70% (làm tròn xuống)', () => {
    expect(authorCut(5)).toBe(3);
    expect(authorCut(10)).toBe(7);
  });
});

describe('VNPay signing', () => {
  it('ký HMAC-SHA512 trên query đã sắp xếp và xác minh lại được', () => {
    process.env.VNPAY_HASH_SECRET = 'secret';
    const params = { vnp_TxnRef: 'abc', vnp_ResponseCode: '00', vnp_Amount: '500000' };
    const { hash, query } = VnpayProvider.sign(params, 'secret');
    expect(query).toBe('vnp_Amount=500000&vnp_ResponseCode=00&vnp_TxnRef=abc');
    expect(new VnpayProvider().verify({ ...params, vnp_SecureHash: hash })).toEqual({ paymentId: 'abc', success: true });
    expect(new VnpayProvider().verify({ ...params, vnp_SecureHash: 'bad' })).toBeNull();
  });
});

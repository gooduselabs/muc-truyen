import { createHmac } from 'crypto';

/** Payment provider abstraction. Only `sandbox` is functional in v0.1; MoMo/VNPay are wired
 * for signature building but untested against real gateways (need merchant keys). */
export interface CreatePaymentInput { paymentId: string; amountVnd: number; description: string; returnUrl: string; ipAddr?: string }
export interface CreatePaymentResult { status: 'SUCCEEDED' | 'PENDING'; payUrl?: string; providerRef?: string }
export interface PaymentProvider {
  id: string;
  label: string;
  enabled(): boolean;
  create(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Verify an IPN/return callback; returns paymentId + success flag when signature is valid. */
  verify(params: Record<string, string>): { paymentId: string; success: boolean } | null;
}

export class SandboxProvider implements PaymentProvider {
  id = 'sandbox';
  label = 'Sandbox (thử nghiệm, không trừ tiền thật)';
  enabled() { return process.env.PAYMENTS_SANDBOX !== 'false'; }
  async create(i: CreatePaymentInput): Promise<CreatePaymentResult> {
    return { status: 'SUCCEEDED', providerRef: `sandbox_${i.paymentId}` };
  }
  verify() { return null; }
}

/** VNPay v2.1.0 — builds a signed redirect URL (HMAC-SHA512 over sorted query). */
export class VnpayProvider implements PaymentProvider {
  id = 'vnpay';
  label = 'VNPay (QR / thẻ ATM)';
  enabled() { return !!(process.env.VNPAY_TMN_CODE && process.env.VNPAY_HASH_SECRET); }
  static sign(params: Record<string, string>, secret: string) {
    const q = Object.keys(params).filter((k) => k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType').sort()
      .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`).join('&');
    return { query: q, hash: createHmac('sha512', secret).update(q).digest('hex') };
  }
  async create(i: CreatePaymentInput): Promise<CreatePaymentResult> {
    const d = new Date(Date.now() + 7 * 3600e3).toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const p: Record<string, string> = {
      vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: process.env.VNPAY_TMN_CODE!, vnp_Amount: String(i.amountVnd * 100),
      vnp_CurrCode: 'VND', vnp_TxnRef: i.paymentId, vnp_OrderInfo: i.description, vnp_OrderType: 'other', vnp_Locale: 'vn',
      vnp_ReturnUrl: i.returnUrl, vnp_IpAddr: i.ipAddr || '127.0.0.1', vnp_CreateDate: d,
    };
    const { query, hash } = VnpayProvider.sign(p, process.env.VNPAY_HASH_SECRET!);
    const base = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    return { status: 'PENDING', payUrl: `${base}?${query}&vnp_SecureHash=${hash}` };
  }
  verify(params: Record<string, string>) {
    const { hash } = VnpayProvider.sign(params, process.env.VNPAY_HASH_SECRET || '');
    if (hash !== params.vnp_SecureHash) return null;
    return { paymentId: params.vnp_TxnRef, success: params.vnp_ResponseCode === '00' };
  }
}

/** MoMo captureWallet — builds signed request (HMAC-SHA256). */
export class MomoProvider implements PaymentProvider {
  id = 'momo';
  label = 'Ví MoMo';
  enabled() { return !!(process.env.MOMO_PARTNER_CODE && process.env.MOMO_ACCESS_KEY && process.env.MOMO_SECRET_KEY); }
  async create(i: CreatePaymentInput): Promise<CreatePaymentResult> {
    const e = process.env;
    const ipnUrl = `${e.PUBLIC_URL}/api/wallet/ipn/momo`;
    const raw = `accessKey=${e.MOMO_ACCESS_KEY}&amount=${i.amountVnd}&extraData=&ipnUrl=${ipnUrl}&orderId=${i.paymentId}&orderInfo=${i.description}&partnerCode=${e.MOMO_PARTNER_CODE}&redirectUrl=${i.returnUrl}&requestId=${i.paymentId}&requestType=captureWallet`;
    const signature = createHmac('sha256', e.MOMO_SECRET_KEY!).update(raw).digest('hex');
    const res = await fetch(e.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ partnerCode: e.MOMO_PARTNER_CODE, requestId: i.paymentId, amount: i.amountVnd, orderId: i.paymentId,
        orderInfo: i.description, redirectUrl: i.returnUrl, ipnUrl, requestType: 'captureWallet', extraData: '', lang: 'vi', signature }),
    });
    const j: any = await res.json();
    return { status: 'PENDING', payUrl: j.payUrl, providerRef: j.requestId };
  }
  verify(p: Record<string, string>) {
    const e = process.env;
    const raw = `accessKey=${e.MOMO_ACCESS_KEY}&amount=${p.amount}&extraData=${p.extraData ?? ''}&message=${p.message}&orderId=${p.orderId}&orderInfo=${p.orderInfo}&orderType=${p.orderType}&partnerCode=${p.partnerCode}&payType=${p.payType}&requestId=${p.requestId}&responseTime=${p.responseTime}&resultCode=${p.resultCode}&transId=${p.transId}`;
    const sig = createHmac('sha256', e.MOMO_SECRET_KEY || '').update(raw).digest('hex');
    if (sig !== p.signature) return null;
    return { paymentId: p.orderId, success: String(p.resultCode) === '0' };
  }
}

export const PROVIDERS: PaymentProvider[] = [new SandboxProvider(), new MomoProvider(), new VnpayProvider()];

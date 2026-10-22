import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Send OTP verification email to user
 * @param to - Recipient email address
 * @param otpCode - 6-digit OTP code
 * @param isStudent - Whether this is for student verification (.ac.id)
 */
export async function sendOtpEmail(
  to: string,
  otpCode: string,
  isStudent: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = isStudent
      ? 'Kode Verifikasi Mahasiswa Kampus Thrift'
      : 'Kode Verifikasi Akun Kampus Thrift'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0;">Kampus Thrift</h1>
          <p style="color: #666; margin-top: 4px;">Hyperlocal C2C Preloved Marketplace</p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; color: #333;">Berikut adalah kode verifikasi OTP Anda:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; padding: 12px; background: #fff; border-radius: 4px; display: inline-block;">
            ${otpCode}
          </div>
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748b;">
            Kode ini berlaku selama <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapapun.
          </p>
        </div>

        ${
          isStudent
            ? `<div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 13px;">
                  🎓 <strong>Verifikasi Mahasiswa:</strong> Setelah memverifikasi email kampus (.ac.id), Anda akan mendapatkan <strong>Verified Student Badge</strong> dan dapat menggunakan fitur <strong>Barter</strong>!
                </p>
              </div>`
            : ''
        }

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          Jika Anda tidak merasa meminta kode ini, abaikan email ini.
        </p>
      </div>
    `

    // In local development without configured SMTP, log to console
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('--------------------------------------------------')
      console.log(`[DEV OTP EMAIL] To: ${to}`)
      console.log(`[DEV OTP CODE]  Code: ${otpCode}`)
      console.log('--------------------------------------------------')
      return { success: true }
    }

    await transporter.sendMail({
      from: `"Kampus Thrift" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send OTP email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengirim email OTP',
    }
  }
}

import { PDFDocument, StandardFonts } from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'
import { addDoc } from './store'

// All sample data is fictional: made-up person, countries, bank and employer.
// Documents are generated client-side so no binary files ship with the repo,
// and every page is real extractable text — which is what inspect_document reads.

type Line = string | { text: string; size?: number; bold?: boolean; gapBefore?: number }

interface Fonts {
  regular: PDFFont
  bold: PDFFont
}

const A4: [number, number] = [595, 842]

function drawPage(pdf: PDFDocument, fonts: Fonts, lines: Line[]) {
  const page = pdf.addPage(A4)
  let y = 790
  for (const raw of lines) {
    const line = typeof raw === 'string' ? { text: raw } : raw
    y -= line.gapBefore ?? 0
    const size = line.size ?? 10
    page.drawText(line.text, {
      x: 50,
      y,
      size,
      font: line.bold ? fonts.bold : fonts.regular,
    })
    y -= size + 7
  }
}

async function embedFonts(pdf: PDFDocument): Promise<Fonts> {
  return {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  }
}

async function buildPassport(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const fonts = await embedFonts(pdf)
  drawPage(pdf, fonts, [
    { text: 'REPUBLIC OF EXAMPLIA', size: 16, bold: true },
    { text: 'PASSPORT / PASSEPORT', size: 12, bold: true },
    { text: 'SPECIMEN - NOT A TRAVEL DOCUMENT', size: 9 },
    { text: 'Type: P    Country code: EXA    Passport No: E1234567', gapBefore: 20 },
    'Surname: KUMAR',
    'Given names: ARJUN',
    'Nationality: EXAMPLIAN',
    'Date of birth: 12 MAR 1994',
    'Place of birth: PORT MERIDIAN, EXAMPLIA',
    'Sex: M',
    'Date of issue: 02 JAN 2023',
    'Date of expiry: 01 JAN 2033',
    'Issuing authority: MINISTRY OF EXTERNAL AFFAIRS, EXAMPLIA',
    { text: 'P<EXAKUMAR<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<<', gapBefore: 24 },
    'E1234567<8EXA9403129M3301017<<<<<<<<<<<<<<04',
  ])
  return pdf.save()
}

function monthPage(month: string, rows: string[], note?: string): Line[] {
  const lines: Line[] = [
    { text: 'EXAMPLIA NATIONAL BANK', size: 12, bold: true },
    { text: `TRANSACTION HISTORY - ${month} 2026`, size: 11, bold: true },
    { text: 'Account: 00042-871-556219    Holder: ARJUN KUMAR', gapBefore: 6 },
    { text: 'Date          Description                                Amount (INR)      Balance', bold: true, gapBefore: 14 },
  ]
  for (const row of rows) lines.push(row)
  if (note) lines.push({ text: note, gapBefore: 14 })
  return lines
}

async function buildBankStatement(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const fonts = await embedFonts(pdf)

  // Page 1 - cover / summary
  drawPage(pdf, fonts, [
    { text: 'EXAMPLIA NATIONAL BANK', size: 16, bold: true },
    { text: 'ACCOUNT STATEMENT', size: 12, bold: true },
    { text: 'Statement period: 01 JAN 2026 - 15 JUN 2026', gapBefore: 20 },
    'Account holder: ARJUN KUMAR',
    'Account number: 00042-871-556219',
    'Branch: PORT MERIDIAN CENTRAL',
    'Account type: SAVINGS',
    { text: 'Opening balance: INR 91,430.00', gapBefore: 14 },
    'Closing balance: INR 6,08,115.00',
    'Total credits: INR 7,42,300.00',
    'Total debits: INR 2,25,615.00',
    { text: 'This statement has 12 pages. Transaction details begin on page 3.', gapBefore: 20 },
  ])

  // Page 2 - account holder details
  drawPage(pdf, fonts, [
    { text: 'EXAMPLIA NATIONAL BANK', size: 12, bold: true },
    { text: 'ACCOUNT HOLDER DETAILS', size: 11, bold: true },
    { text: 'Name: ARJUN KUMAR', gapBefore: 14 },
    'Registered address: 14 Harbour Lane, Port Meridian, Examplia 400021',
    'Registered mobile: +99 98200 11223',
    'Email: arjun.kumar@example.com',
    'Customer since: 2019',
    'Nominee registered: YES',
    { text: 'KYC status: VERIFIED (last updated 11 NOV 2025)', gapBefore: 14 },
  ])

  // Page 3 - January: before the new job, no salary credit
  drawPage(pdf, fonts, monthPage('JANUARY', [
    '03 Jan 2026   UPI - GREENGROCER MART                     -1,240.00        90,190.00',
    '06 Jan 2026   UPI - CITY TRANSIT PASS                    -1,800.00        88,390.00',
    '11 Jan 2026   TRANSFER FROM R KUMAR                     +10,000.00        98,390.00',
    '14 Jan 2026   CARD - BOOKWORM STORES                       -960.00        97,430.00',
    '19 Jan 2026   UPI - HARBOUR CAFE                           -420.00        97,010.00',
    '24 Jan 2026   ELECTRICITY BOARD AUTOPAY                  -2,150.00        94,860.00',
    '28 Jan 2026   UPI - GREENGROCER MART                     -1,105.00        93,755.00',
    '31 Jan 2026   TRANSFER FROM OWN SAVINGS                 +22,000.00       1,15,755.00',
  ]))

  // Pages 4-7 - February through May: SALARY CREDIT lands on each
  drawPage(pdf, fonts, monthPage('FEBRUARY', [
    '02 Feb 2026   UPI - CITY TRANSIT PASS                    -1,800.00       1,13,955.00',
    '07 Feb 2026   CARD - HOMEWARE DEPOT                      -4,320.00       1,09,635.00',
    '12 Feb 2026   UPI - HARBOUR CAFE                           -510.00       1,09,125.00',
    '15 Feb 2026   RENT TRANSFER - LANDLORD M PATEL          -18,000.00        91,125.00',
    '21 Feb 2026   UPI - GREENGROCER MART                     -1,340.00        89,785.00',
    '27 Feb 2026   SALARY CREDIT - MERIDIAN SOFTWARE PVT LTD +1,45,000.00     2,34,785.00',
  ]))

  drawPage(pdf, fonts, monthPage('MARCH', [
    '02 Mar 2026   RENT TRANSFER - LANDLORD M PATEL          -18,000.00       2,16,785.00',
    '05 Mar 2026   UPI - CITY TRANSIT PASS                    -1,800.00       2,14,985.00',
    '09 Mar 2026   CARD - PHARMACARE                            -640.00       2,14,345.00',
    '14 Mar 2026   MUTUAL FUND SIP AUTOPAY                   -15,000.00       1,99,345.00',
    '18 Mar 2026   UPI - GREENGROCER MART                     -1,215.00       1,98,130.00',
    '23 Mar 2026   UPI - HARBOUR CAFE                           -385.00       1,97,745.00',
    '31 Mar 2026   SALARY CREDIT - MERIDIAN SOFTWARE PVT LTD +1,45,000.00     3,42,745.00',
  ]))

  drawPage(pdf, fonts, monthPage('APRIL', [
    '01 Apr 2026   RENT TRANSFER - LANDLORD M PATEL          -18,000.00       3,24,745.00',
    '06 Apr 2026   UPI - CITY TRANSIT PASS                    -1,800.00       3,22,945.00',
    '10 Apr 2026   CARD - AIRWAYS BOOKING (DOMESTIC)          -8,450.00       3,14,495.00',
    '14 Apr 2026   MUTUAL FUND SIP AUTOPAY                   -15,000.00       2,99,495.00',
    '20 Apr 2026   UPI - GREENGROCER MART                     -1,480.00       2,98,015.00',
    '30 Apr 2026   SALARY CREDIT - MERIDIAN SOFTWARE PVT LTD +1,45,000.00     4,43,015.00',
  ]))

  drawPage(pdf, fonts, monthPage('MAY', [
    '01 May 2026   RENT TRANSFER - LANDLORD M PATEL          -18,000.00       4,25,015.00',
    '05 May 2026   UPI - CITY TRANSIT PASS                    -1,800.00       4,23,215.00',
    '11 May 2026   CARD - HOMEWARE DEPOT                      -2,260.00       4,20,955.00',
    '14 May 2026   MUTUAL FUND SIP AUTOPAY                   -15,000.00       4,05,955.00',
    '19 May 2026   UPI - HARBOUR CAFE                           -455.00       4,05,500.00',
    '26 May 2026   UPI - GREENGROCER MART                     -1,385.00       4,04,115.00',
    '29 May 2026   SALARY CREDIT - MERIDIAN SOFTWARE PVT LTD +1,45,000.00     5,49,115.00',
  ]))

  // Page 8 - June: statement cuts off mid-month, before payday
  drawPage(pdf, fonts, monthPage('JUNE', [
    '01 Jun 2026   RENT TRANSFER - LANDLORD M PATEL          -18,000.00       5,31,115.00',
    '04 Jun 2026   UPI - CITY TRANSIT PASS                    -1,800.00       5,29,315.00',
    '09 Jun 2026   UPI - GREENGROCER MART                     -1,200.00       5,28,115.00',
    '13 Jun 2026   TRANSFER FROM OWN SAVINGS                 +80,000.00       6,08,115.00',
  ], 'Statement period ends 15 JUN 2026. Transactions after this date appear on the next statement.'))

  // Pages 9-12 - summaries and boilerplate
  drawPage(pdf, fonts, [
    { text: 'EXAMPLIA NATIONAL BANK', size: 12, bold: true },
    { text: 'FEES AND CHARGES SUMMARY', size: 11, bold: true },
    { text: 'Account maintenance fee (Jan-Jun): INR 0.00 (waived, salary account)', gapBefore: 14 },
    'ATM withdrawals beyond free limit: INR 63.00',
    'SMS alert charges: INR 90.00',
    'Debit card annual fee: INR 299.00',
    { text: 'Total charges for the period: INR 452.00', gapBefore: 14, bold: true },
  ])

  drawPage(pdf, fonts, [
    { text: 'EXAMPLIA NATIONAL BANK', size: 12, bold: true },
    { text: 'INTEREST SUMMARY', size: 11, bold: true },
    { text: 'Interest rate (savings): 3.25% p.a.', gapBefore: 14 },
    'Interest credited 31 MAR 2026: INR 1,214.00',
    'Interest accrued (Apr-Jun, to be credited 30 SEP 2026): INR 2,890.00',
  ])

  drawPage(pdf, fonts, [
    { text: 'EXAMPLIA NATIONAL BANK', size: 12, bold: true },
    { text: 'IMPORTANT INFORMATION', size: 11, bold: true },
    { text: 'Please verify the entries in this statement within 30 days of receipt.', gapBefore: 14 },
    'Report discrepancies to your home branch or via the customer portal.',
    'This statement is system-generated and does not require a signature.',
    'Balances shown are end-of-day balances after each transaction.',
  ])

  drawPage(pdf, fonts, [
    { text: 'EXAMPLIA NATIONAL BANK', size: 12, bold: true },
    { text: 'DISCLOSURES AND CONTACT', size: 11, bold: true },
    { text: 'Deposits are insured under the Examplia Deposit Guarantee Scheme.', gapBefore: 14 },
    'Customer care: 1800 000 4242 (24x7)',
    'Website: www.example.com/enb',
    'Registered office: 1 Bank Square, Port Meridian, Examplia 400001',
    { text: 'End of statement - page 12 of 12', gapBefore: 20 },
  ])

  return pdf.save()
}

async function buildVisaForm(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const fonts = await embedFonts(pdf)
  drawPage(pdf, fonts, [
    { text: 'KINGDOM OF NORDHAVEN', size: 16, bold: true },
    { text: 'VISA APPLICATION FORM (SPECIMEN)', size: 12, bold: true },
    { text: 'Form NV-101 - Short-stay visitor visa', size: 9 },
    { text: 'SECTION 1 - APPLICANT', bold: true, gapBefore: 20 },
    'Surname: KUMAR',
    'Given names: ARJUN',
    'Date of birth: 12 MAR 1994',
    'Nationality: EXAMPLIAN',
    'Passport number: E1234567',
    'Passport expiry: 01 JAN 2033',
    { text: 'SECTION 2 - TRAVEL DETAILS', bold: true, gapBefore: 16 },
    'Purpose of visit: TOURISM',
    'Intended arrival: 15 SEP 2026',
    'Intended departure: 29 SEP 2026',
    'Address in Nordhaven: HOTEL FJORDVIEW, 8 QUAY STREET, NORDHAVEN CITY',
  ])
  drawPage(pdf, fonts, [
    { text: 'KINGDOM OF NORDHAVEN - FORM NV-101 (PAGE 2)', size: 12, bold: true },
    { text: 'SECTION 3 - SUPPORTING DOCUMENTS CHECKLIST', bold: true, gapBefore: 16 },
    '[x] Passport bio page',
    '[x] Proof of funds: bank statement pages showing regular salary credits',
    '[x] Completed form NV-101',
    '[ ] Travel insurance certificate (to be attached at appointment)',
    { text: 'SECTION 4 - DECLARATION', bold: true, gapBefore: 16 },
    'I declare that the information given in this application is true and complete.',
    { text: 'Signature: ARJUN KUMAR          Date: 20 AUG 2026', gapBefore: 20 },
    { text: 'Consulate use only: ____________________________', gapBefore: 24 },
  ])
  return pdf.save()
}

let loading = false

/** Generates and loads the three fictional demo documents into the workspace. */
export async function loadSampleDocuments(): Promise<void> {
  if (loading) return
  loading = true
  try {
    const [passport, statement, form] = await Promise.all([
      buildPassport(),
      buildBankStatement(),
      buildVisaForm(),
    ])
    addDoc('passport-arjun-kumar.pdf', passport, 1)
    addDoc('bank-statement-jan-jun.pdf', statement, 12)
    addDoc('visa-application-form.pdf', form, 2)
  } finally {
    loading = false
  }
}

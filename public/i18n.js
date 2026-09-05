/* ═══════════════════════════════════════════════════════════════
   TalatSuite i18n — ไทย (ค่าเริ่มต้น) / English
   เครื่องแปลภาษาแบบ DOM-pass:
   - แอปเขียน UI เป็นภาษาไทยตามปกติ
   - เมื่อเปิดโหมด EN เครื่องจะแปลข้อความที่แสดงผลทั้งหมด
     (text node + placeholder + title + aria-label) อัตโนมัติ
     ผ่าน MutationObserver — ไม่ต้องแก้โค้ดหน้าแอปเลย
   - เพิ่มภาษาใหม่ภายหลัง: เพิ่ม key ใน EXACT/PATTERNS ของภาษานั้น
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const LANG_KEY = 'talatsuite.lang';
  const SUPPORTED = ['th', 'en'];
  const LANG_LABEL = { th: 'ไทย', en: 'English' };
  let memLang = 'th';
  function readLang() {
    try {
      const v = localStorage.getItem(LANG_KEY);
      if (v && SUPPORTED.includes(v)) return v;
    } catch (e) { /* sandbox/preview */ }
    return memLang;
  }
  function writeLang(l) {
    memLang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* ใช้ memLang แทน */ }
  }

  /* ---------- พจนานุกรม: คำตรงตัว (ไทย → EN) ---------- */
  const EXACT = {
    /* ทั่วไป */
    'ตกลง': 'OK', 'ใช่': 'Yes', 'ยกเลิก': 'Cancel', 'ปิด': 'Close', 'บันทึก': 'Save',
    'ลบ': 'Delete', 'แก้ไข': 'Edit', 'เพิ่ม': 'Add', 'เปลี่ยน': 'Change', 'ดู': 'View',
    'กลับ': 'Back', 'ย้อนกลับ': 'Back', '← ย้อนกลับ': '← Back',
    '← กลับหน้าเริ่มต้น': '← Back to start screen',
    'กลับหน้าหลัก': 'Home', 'หน้าหลัก': 'Home', 'เรียลไทม์': 'Live',
    'โหลด': 'Loading…', 'กำลังโหลด…': 'Loading…', 'ทั้งหมด': 'All',
    'ออกจากระบบ': 'Log out', 'เข้าสู่ระบบ': 'Log in', 'ออกจากระบบแล้ว': 'Logged out',
    'ออกจากระบบบัญชีนี้': 'Sign out of this account',
    'เข้าใช้งานต่อ →': 'Continue →',
    'คุณ': 'you', '(คุณ)': '(you)', 'ยังไม่เคย': 'never', 'ไม่ระบุ': 'unspecified',
    'ดูทั้งหมด →': 'View all →', 'จัดการตลาด →': 'Manage markets →',
    'เมื่อสักครู่': 'just now', 'เห็นในแอปทันที': 'visible in the app instantly',
    'ปิดหน้าต่าง': 'Close window', 'ตรวจสอบ': 'Check',
    'รายละเอียด': 'Details', 'ชื่อ': 'Name', 'ราคา': 'Price', 'สถานะ': 'Status',
    'วันที่': 'Date', 'เวลา': 'Time', 'ยอดรวม': 'Total', 'หมายเหตุ': 'Note',
    'ค้นหา': 'Search', 'ค้นหา…': 'Search…', 'ไม่พบ': 'Not found',

    /* บทบาท */
    'แอดมินระบบ': 'System admin', 'ผู้จัดการตลาด': 'Market manager',
    'ร้านค้า/แม่ค้า': 'Vendor', 'ลูกค้า': 'Customer', 'ร้านค้า': 'Vendor',
    'สมาชิก': 'Member', 'แขก': 'Guest', 'ผู้ดูแลทุกตลาด': 'All markets owner',
    'แพลตฟอร์มจัดการตลาด': 'Market management platform',
    'กลับคอนโซลแอดมิน': 'Back to admin console',
    '🛡️ หน้าแอดมิน': '🛡️ Admin console',
    '🔑 เข้าสู่ระบบ': '🔑 Log in', '🔑 ล็อกอิน': '🔑 Log in',

    /* นำทาง */
    'ภาพรวมรายรับและผังล็อค': 'Revenue overview & lot map',
    'ร้านค้าในตลาด': 'Shops in market', 'ทะเบียนร้านและช่องทางติดต่อ': 'Shop registry & contact channels',
    'ตั้งค่าตลาด': 'Market settings', 'ข้อมูล · เวลาเปิด · ผังแถวล็อค': 'Info · hours · lot rows',
    'รับออเดอร์': 'Orders', 'POS สั่งหน้าร้าน': 'In-store POS', 'รับออร์เดอร์': 'Orders',
    'คิวครัว': 'Kitchen queue', 'ออเดอร์เรียลไทม์': 'Live orders', 'ออร์เดอร์เรียลไทม์': 'Live orders',
    'เมนูสินค้า': 'Menu', 'ราคา รูปภาพ สต็อก': 'Prices · photos · stock',
    'ร้านของฉัน': 'My shop', 'โปรไฟล์และติดต่อ': 'Profile & contact',
    'สั่งอาหาร': 'Order food', 'เลือกตลาดและร้าน': 'Pick a market & shop',
    'ออเดอร์ของฉัน': 'My orders', 'ติดตามสถานะเรียลไทม์': 'Track status live', 'ออร์เดอร์ของฉัน': 'My orders',
    'ภาพรวมระบบ': 'System overview', 'สถิติทุกตลาดแบบเรียลไทม์': 'Live stats for all markets',
    'จัดการตลาด': 'Manage markets', 'สร้าง · ลบ · ผูกบัญชีผู้จัดการ': 'Create · delete · assign managers',
    'บัญชีผู้ใช้': 'User accounts', 'ผจก. · ร้านค้า · ลูกค้า': 'Managers · vendors · customers',
    'ข้อมูลลูกค้า': 'Customer database', 'เพื่อการตลาด + ส่งออก CSV': 'For marketing + CSV export',
    'กลับหน้าเลือกบทบาท (ไม่ออกจากระบบ)': 'Back to role chooser (still logged in)',

    /* หน้าเริ่มต้น */
    'เข้าชมตลาด & สั่งอาหาร': 'Browse markets & order food',
    'ดูตลาดที่เปิดวันนี้ เลือกร้าน ดูเมนู — ไม่ต้องสมัครก่อนก็เดินดูได้': 'See markets open today, pick a shop, browse menus — no sign-up needed to look around',
    'เข้าสู่ระบบ': 'Log in',
    'ผู้จัดการตลาด · ร้านค้า · สมาชิก · แอดมิน': 'Market manager · vendor · member · admin',
    'สมัครสมาชิกใหม่': 'Create an account', 'ลูกค้า หรือ เปิดร้านค้าใหม่': 'Customer or new vendor shop',
    'ฟรี — ลูกค้าใช้เบอร์โทรเป็นบัญชี': 'Free — customers use a phone number as login',
    'สั่งอาหารผ่านแอปต้องเป็นสมาชิก (สมัครฟรีด้วยเบอร์โทร) · ผู้จัดการตลาดและร้านค้าใช้บัญชีที่ผู้ดูแลระบบจัดให้':
      'Ordering in the app requires a free phone-number account · managers & vendors use accounts issued by the system admin',

    /* ═══ v6: เลือกบทบาท + ระบบสมัคร-อนุมัติ ═══ */
    'คุณคือใคร? — เลือกเพื่อเริ่มใช้งาน': 'Who are you? — pick one to get started',
    'ลูกค้า': 'Customer',
    'ดูตลาด · เดินดูร้าน · สั่งอาหาร — เริ่มได้เลยไม่ต้องสมัคร': 'Browse markets & shops, order food — start instantly, no sign-up needed',
    'ร้านค้า': 'Vendor shop',
    'สมัครเปิดร้านในตลาดที่คุณชอบ — รอผจก.ตลาดอนุมัติ': 'Apply to open a shop in any market — the manager approves',
    'ผู้จัดการตลาด': 'Market manager',
    'ยื่นเปิดตลาดของคุณเอง — แอดมินอนุมัติก่อนเผยแพร่': 'Submit your own market — admin approves before publishing',
    '🔑 เข้าสู่ระบบ — แอดมิน / สมาชิกเดิม': '🔑 Log in — admin / existing members',
    '📝 สมัครสมาชิก (ลูกค้า)': '📝 Sign up (customer)',
    'ร้านค้าและผู้จัดการตลาดสมัครเองได้เลย — ทุกใบสมัครจะได้รับการอนุมัติก่อนเผยแพร่ · ลูกค้าสั่งอาหารสมัครฟรีด้วยเบอร์โทร':
      'Vendors and managers can sign up directly — every application is approved before publishing · customers order with a free phone account',
    'สมัครสมาชิก (ลูกค้า)': 'Sign up (customer)',
    'ฟรี — ใช้เบอร์โทรเป็นบัญชี สั่งอาหารและเก็บประวัติได้': 'Free — your phone number is your login; order and keep your history',
    'ต้องการเปิดร้านค้าหรือยื่นเปิดตลาด? — กลับหน้าแรกแล้วเลือกบทบาท "ร้านค้า" หรือ "ผู้จัดการตลาด" ครับ':
      'Want to open a shop or run a market? — go back to the home page and pick the "Vendor shop" or "Market manager" role',

    /* v6: หน้าร้านค้าสมัครเข้าตลาด */
    'เปิดร้านในตลาด 🍜': 'Open a shop in a market 🍜',
    'ขยายร้านไปตลาดใหม่ 🚀': 'Expand to a new market 🚀',
    '3 ขั้นตอน — เลือกตลาด · กรอกข้อมูลร้าน · เลือกล็อค แล้วรอผจก.ตลาดอนุมัติ': '3 steps — pick a market, fill in shop info, choose a lot, then wait for approval',
    'กลับร้านของฉัน': 'Back to my shop',
    'ยังไม่มีตลาดที่เปิดรับร้านค้า': 'No markets accepting vendors yet',
    'โปรดกลับมาใหม่อีกครั้ง — หรือถ้าคุณเป็นเจ้าของพื้นที่ ลอง "ยื่นเปิดตลาดใหม่" ที่หน้าแรกครับ': 'Please check back later — or if you own a venue, try "Submit a new market" on the home page',
    'สมัครเปิดร้าน': 'Apply to open',
    '☀️ กลางวัน': '☀️ Day', '🌙 กลางคืน': '🌙 Night',
    '☀️ ตลาดกลางวัน': '☀️ Day market', '🌙 ตลาดกลางคืน': '🌙 Night market',
    'ร้านในตลาด': 'shops in market',
    '📋 รอพิจารณา': '📋 Pending review', '✅ อนุมัติแล้ว': '✅ Approved', '❌ ปฏิเสธ': '❌ Denied',
    'คำขอเข้าร่วมตลาดนี้รอผจก.ตลาด/แอดมินพิจารณา — เราจะแจ้งในแอปทันทีที่มีผล': 'This application is awaiting manager/admin review — the result appears in the app as soon as it is decided',
    'ร้านของคุณเปิดให้ลูกค้าเห็นในตลาดนี้แล้ว': 'Your shop is live to customers in this market',
    '👤 บัญชีร้านค้า (สร้างใหม่อัตโนมัติ)': '👤 Vendor account (created automatically)',
    'ชื่อเจ้าของร้าน': 'Owner name',
    'ชื่อผู้ใช้ (a-z, 0-9)': 'Username (a-z, 0-9)',
    '🏪 ข้อมูลร้าน': '🏪 Shop details',
    'ชื่อร้าน': 'Shop name', 'ประเภทร้าน': 'Shop category',
    '🍳 อาหาร & เครื่องดื่ม': '🍳 Food & drinks', '👕 เสื้อผ้า & แฟชั่น': '👕 Clothing & fashion',
    '🥬 ของสด & ผักผลไม้': '🥬 Fresh produce', '🧺 ของใช้ & อื่น ๆ': '🧺 General goods',
    'แนะนำร้านสั้น ๆ (ผจก.จะเห็นตอนพิจารณา)': 'Short shop intro (the manager sees this when reviewing)',
    '📍 เลือกล็อคที่ต้องการ': '📍 Pick your lot',
    'เลือกล็อคว่างที่ต้องการ — หรือไม่เลือกก็ได้ ผจก.จะจัดล็อคให้ตอนอนุมัติ': 'Pick any free lot — or skip it and the manager assigns one on approval',
    'ตลาดนี้ยังไม่มีผังล็อค — ยื่นไว้ก่อนได้เลย ผจก.ตลาดจะจัดล็อคให้ตอนอนุมัติครับ': 'This market has no lot map yet — apply anyway and the manager assigns a lot on approval',
    '📨 ส่งใบสมัคร': '📨 Submit application',
    'ส่งใบสมัครแล้ว 🎉': 'Application sent 🎉', 'ยื่นใบสมัครแล้ว 🎉': 'Application sent 🎉',
    'ขอบคุณครับ!': 'Thank you!',
    'ยื่นเข้าร่วม': 'applied to join',
    'เรียบร้อย': 'successfully',
    'ผจก.ตลาดหรือแอดมินจะพิจารณาใบสมัครของคุณ — สถานะจะแสดงในหน้าร้านของคุณทันทีที่อัปเดต': 'The market manager or admin will review your application — the status shows on your shop page as soon as it updates',
    'ดูสถานะใบสมัครของฉัน': 'View my application status',
    '⇄ สลับตลาด': '⇄ Switch market', 'สลับตลาด': 'Switch market',
    '🚀 ขยายไปตลาดอื่น': '🚀 Expand to another market',
    'ร้านของคุณในแต่ละตลาด': 'Your shop in each market',

    /* v6: ผจก.ยื่นตลาด */
    'ยื่นเปิดตลาดของคุณ 🧑‍💼': 'Submit your market 🧑‍💼',
    'ยื่นเปิดตลาดใหม่อีกครั้ง 🧑‍💼': 'Submit a market again 🧑‍💼',
    'กรอกข้อมูลตลาด — แอดมินระบบจะพิจารณาและอนุมัติก่อนเผยแพร่ให้ลูกค้าเห็น': 'Fill in your market details — the system admin reviews and approves before it goes public',
    '👤 บัญชีผู้จัดการตลาด': '👤 Manager account',
    'ชื่อ-นามสกุลผู้จัดการ': 'Manager full name',
    '🏪 ข้อมูลตลาด': '🏪 Market details',
    'ชื่อตลาด': 'Market name',
    'ที่ตั้ง / ย่าน': 'Location / area',
    'ที่อยู่ (ลูกค้าจะใช้นำทาง)': 'Address (customers use it for directions)',
    'ตลาดแบบไหน?': 'What type of market?',
    'เวลาเปิด': 'Opening time', 'เวลาปิด': 'Closing time',
    'เปิดทำการวันไหน?': 'Open which days?',
    'แนะนำตลาดสั้น ๆ (แอดมินจะเห็นตอนพิจารณา)': 'Short market intro (the admin sees this when reviewing)',
    '📨 ยื่นใบสมัครเปิดตลาด': '📨 Submit market application',
    'หลังอนุมัติ คุณจะได้หน้าจัดการตลาดเต็มรูปแบบ — ผังล็อค ค่าเช่า อนุมัติร้านค้า และรายงาน': 'After approval you get the full market dashboard — lot map, rent, vendor approvals and reports',
    'หลังอนุมัติ ตลาดของคุณจะเผยแพร่ให้ลูกค้าเห็นทันที และคุณจะได้หน้าจัดการตลาดเต็มรูปแบบ': 'Once approved, your market goes public instantly and you get the full management dashboard',
    'ไปหน้าจัดการตลาดของฉัน': 'Go to my market dashboard',
    'เลือกวันเปิดทำการอย่างน้อย 1 วัน': 'Pick at least 1 open day',
    'ใช้บัญชีของคุณอยู่แล้ว — กรอกเฉพาะข้อมูลตลาดใหม่ได้เลยครับ': 'You already have an account — just fill in the new market details',
    'ยื่นเมื่อ': 'Submitted',

    /* v6: สถานะ + หน้าพิจารณาใบสมัคร */
    'ใบสมัครตลาดของคุณ': 'Your market applications',
    'สถานะการยื่นเปิดตลาด': 'Market application status',
    'รอแอดมินพิจารณา — ตลาดจะเผยแพร่ทันทีที่อนุมัติ': 'Awaiting admin review — publishes instantly once approved',
    'อนุมัติแล้ว — ตลาดพร้อมใช้งาน': 'Approved — market is ready',
    'ยังไม่มีใบสมัคร': 'No applications yet',
    'ยื่นเปิดตลาดใหม่': 'Submit a new market',
    'ใบสมัครร้านค้า 📨': 'Vendor applications 📨',
    'ร้านค้าที่ยื่นขอเข้าร่วมตลาดของคุณ': 'Shops applying to join your market',
    'เมื่อร้านค้าสมัครเข้าร่วมตลาดของคุณ ใบสมัครจะแสดงที่นี่พร้อมปุ่มอนุมัติ/ปฏิเสธ': 'When vendors apply to join your market, their applications appear here with approve/deny buttons',
    'ใบสมัครเข้าใหม่ 📨': 'Incoming applications 📨',
    'ตลาดใหม่ (คุณอนุมัติ) และร้านค้าใหม่ (คุณหรือผจก.ตลาดอนุมัติ)': 'New markets (you approve) and new shops (you or the market manager approve)',
    'ใบสมัครตลาดใหม่และร้านค้าใหม่จะแสดงที่นี่': 'New market and shop applications will appear here',
    'รอพิจารณา': 'Pending review', 'พิจารณาแล้ว': 'Reviewed',
    'ตลาดใหม่:': 'New market:', 'ร้านค้าใหม่:': 'New shop:',
    'ในตลาด': 'In market', 'ให้ผจก.จัดล็อค': 'manager assigns lot',
    'อาหาร': 'Food',
    '✅ อนุมัติ': '✅ Approve', '❌ ปฏิเสธ': '❌ Deny',
    'อนุมัติแล้วตลาดจะเผยแพร่ทันที': 'Approving publishes the market instantly',
    'ปฏิเสธใบสมัคร': 'Deny application',
    'เหตุผลจะแสดงให้ผู้สมัครเห็น — ช่วยให้เขาแก้ไขแล้วยื่นใหม่ได้': 'The reason is shown to the applicant — it helps them fix things and reapply',
    'เหตุผลที่ปฏิเสธ': 'Denial reason',
    'ยืนยันปฏิเสธ': 'Confirm denial',
    'อนุมัติเรียบร้อย ✅ — แจ้งเจ้าของใบสมัครในแอปแล้ว': 'Approved ✅ — the applicant has been notified in the app',
    'ปฏิเสธแล้ว — ผู้สมัครจะเห็นเหตุผลและยื่นใหม่ได้': 'Denied — the applicant sees the reason and can reapply',
    'เหตุผล:': 'Reason:',
    'ถูกปฏิเสธ:': 'Denied:',
    'ต้องการเปิดร้านค้าหรือยื่นเปิดตลาดของคุณเอง? — กลับหน้าแรกแล้วเลือกบทบาท "ร้านค้า" หรือ "ผู้จัดการตลาด" ครับ': 'Want to open a shop or start your own market? — Go back to the start screen and pick the "Shop" or "Market manager" role',
    'สมัครเปิดร้านในตลาดอื่น': 'Apply to open a shop in another market',
    'ร้านในตลาด': 'shops in this market',
    'กลางวัน ☀️ หรือ กลางคืน 🌙': 'Day market ☀️ or night market 🌙',
    'กรอกข้อมูลร้าน': 'Fill in shop info',
    'ชื่อ · ประเภท · ติดต่อ': 'Name · type · contact',
    'เลือกล็อค': 'Pick a lot',
    'เห็นล็อคว่าง-ราคาเช่าจริง': 'See free lots & real rents',
    'รออนุมัติ': 'Await approval',
    'ผจก.ตลาดพิจารณาเร็วที่สุด': 'The market manager reviews it as fast as possible',
    'ยื่นใหม่ตลาดนี้หรือเลือกตลาดอื่นได้เลยด้านล่าง': 'Submit a new application for this market or pick another one below',
    'คำขอเข้าร่วมตลาดนี้รอผจก.ตลาด/แอดมินพิจารณา — เราจะแจ้งในแอปทันทีที่มีผล': 'Your application for this market is pending review by the market manager/admin — we will notify you in the app as soon as there is a result',
    'ร้านของคุณเปิดให้ลูกค้าเห็นในตลาดนี้แล้ว': 'Your shop is now visible to customers in this market',
    'รอแอดมินพิจารณา — ตลาดจะเผยแพร่ทันทีที่อนุมัติ': 'Pending admin approval — the market goes live as soon as it is approved',
    'อนุมัติแล้ว — ตลาดพร้อมใช้งาน': 'Approved — market is ready',
    'อนุมัติ/ปฏิเสธ': 'approve/deny',
    'ใบสมัครร้านค้า': 'Vendor applications', 'ใบสมัคร': 'Applications',
    'พิจารณาคำขอเข้าร่วมตลาด': 'Review join requests',
    'พิจารณาตลาดใหม่และร้านค้าใหม่': 'Review new markets and shops',

    /* v6: banner ผจก. + ลูกค้า */
    'ตลาดของคุณรอแอดมินอนุมัติ': 'Your market is awaiting admin approval',
    'ตลาดของคุณถูกปฏิเสธ': 'Your market was denied',
    ' — จะเผยแพร่ให้ลูกค้าเห็นทันทีที่อนุมัติ (จัดการข้อมูลภายในได้ตามปกติ)': ' — it goes public the moment it is approved (you can keep editing meanwhile)',
    '🏪 ทุกตลาด': '🏪 All markets',
    'ไม่มีตลาดประเภทนี้': 'No markets of this type',
    'ลองเลือกตัวกรองอื่นดูครับ': 'Try another filter',
    'เลือกตลาดที่จะเปิดร้าน': 'Choose a market for your shop',
    'เลือกตลาด': 'Choose a market',

    /* ล็อกอิน / สมัคร */
    'ชื่อผู้ใช้ หรือ เบอร์โทร': 'Username or phone number',
    'รหัสผ่าน': 'Password', 'รหัสผ่าน (4 ตัวขึ้นไป)': 'Password (4+ characters)',
    'เข้าสู่ระบบเพื่อสั่งอาหาร': 'Log in to order food',
    'สมาชิกเท่านั้น เพื่อร้านติดต่อคุณกลับได้เมื่ออาหารพร้อม': 'Members only — so the shop can reach you when your food is ready',
    'เบอร์โทรศัพท์ (ใช้เข้าสู่ระบบ)': 'Phone number (your login)',
    'ชื่อผู้ใช้ร้านค้า (a-z, 0-9)': 'Vendor username (a-z, 0-9)',
    '🛒 ลูกค้า': '🛒 Customer', '🍜 เปิดร้านค้า': '🍜 Open a shop',
    'หลังสมัคร ระบบจะพาไปตั้งค่าร้านของคุณ (เลือกตลาด · ชื่อร้าน · ล็อค)': 'After signing up we’ll set up your shop (market · name · lot)',
    'ชื่อ-นามสกุล / ชื่อที่ใช้แสดง': 'Full name / display name',
    'ชื่อ-นามสกุล': 'Full name', 'ชื่อของคุณ': 'Your name',
    'เบอร์ติดต่อสำรอง': 'Alternate phone', 'อีเมล': 'Email',
    'บัญชีทดลอง (แตะเพื่อกรอกให้อัตโนมัติ)': 'Demo accounts (tap to auto-fill)',
    'สมัครสมาชิก': 'Sign up', 'เข้าชมตลาดแบบไม่สมัคร': 'Browse without an account',
    'กรอกบัญชีทดลองให้แล้ว — กด "เข้าสู่ระบบ" ได้เลย': 'Demo account filled in — tap “Log in”',
    'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน': 'Please enter username and password',
    'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง': 'Incorrect username or password',

    /* ตลาด (ลูกค้า) */
    'เลือกตลาด': 'Choose a market',
    'ดูตลาดที่เปิดวันนี้ แล้วเข้าไปสั่งอาหารจากร้านในตลาด': 'See markets open today, then order from shops inside',
    'เปิดวันนี้': 'Open today', 'ปิดวันนี้': 'Closed today',
    '🟢 เปิดวันนี้': '🟢 Open today', '🔴 ปิดวันนี้': '🔴 Closed today',
    'เปิดอยู่': 'Open', 'ปิดอยู่': 'Closed', 'ตลาด': 'Market',
    'ร้าน': 'shop(s)', 'ล็อค': 'lot', 'รายการในเมนู': 'menu items',
    '🌙 ตลาดนี้ ปิดทำการวันนี้ — เดินดูร้านและเมนูได้ แต่ยังสั่งอาหารไม่ได้': '🌙 This market is closed today — you can browse shops and menus, but ordering is disabled',
    '🔴 ร้านนี้ปิดอยู่ในขณะนี้ — ดูเมนูได้ แต่ยังสั่งไม่ได้': '🔴 This shop is currently closed — you can view the menu but not order yet',
    'ยังไม่มีร้านค้าในตลาดนี้': 'No shops in this market yet',
    'ยังไม่มีตลาดในระบบ': 'No markets yet', 'กรุณาลองใหม่ภายหลัง': 'Please try again later',
    'โหลดร้านค้าไม่สำเร็จ': 'Could not load shops',
    'ตารางตลาด:': 'Market schedule:',
    'ที่ตั้ง': 'Location', 'เปิดใน Google Maps': 'Open in Google Maps',
    'นำทาง': 'Directions', '🗺️ ดูแผนที่': '🗺️ View map',

    /* ร้าน (ลูกค้า) */
    'ร้านค้า': 'Shop', 'ยังไม่มีคำอธิบายร้าน': 'No shop description yet',
    'ร้านยังไม่ได้ใส่ช่องทางติดต่อ': 'This shop hasn’t added contact channels yet',
    'โทร': 'Call', '✉️ อีเมล': '✉️ Email',
    'เมนูของร้าน': 'Shop menu', 'ร้านยังไม่มีเมนู': 'No menu yet',
    'ลองกลับมาใหม่ภายหลังนะ': 'Please check back later',
    'สินค้าหมด': 'Sold out', 'รายการ': 'items', 'รวมทั้งหมด': 'Grand total',
    'ดูตะกร้า': 'View cart', 'ตะกร้า': 'Cart',

    /* ตะกร้า / สั่งอาหาร */
    'ยืนยันออเดอร์': 'Confirm order', 'ตรวจรายการก่อนส่งเข้าคิวครัว': 'Review before sending to the kitchen', 'ยืนยันออร์เดอร์': 'Confirm order',
    'ชื่อของคุณ (ร้านใช้เรียกเมื่ออาหารพร้อม)': 'Your name (the shop calls it when ready)',
    'เบอร์โทร (ไม่บังคับ — ร้านติดต่อกลับได้)': 'Phone (optional — lets the shop reach you)',
    'หมายเหตุถึงร้าน': 'Note to the shop',
    '🚀 ส่งออเดอร์ถึงร้าน': '🚀 Send order to shop', '🚀 ส่งออร์เดอร์ถึงร้าน': '🚀 Send order to shop',
    '🚀 ส่งออร์เดอร์ถึงร้าน': '🚀 Send order to shop',
    'ยังไม่ได้เลือกรายการอาหาร': 'No items selected yet',
    'ชื่อลูกค้า / หมายเลขโต๊ะ': 'Customer name / table number',
    'ตะกร้าออเดอร์': 'Order cart', 'ตะกร้าออร์เดอร์': 'Order cart',
    'ตะกร้าออร์เดอร์': 'Order cart',
    'ลด': 'Less', 'เพิ่ม': 'More', 'ลดจำนวน': 'Decrease', 'เพิ่มจำนวน': 'Increase',
    'ลบรายการ': 'Remove item', 'ไม่มีรายการอาหารในออเดอร์นี้': 'No items in this order', 'ไม่มีรายการอาหารในออร์เดอร์นี้': 'No items in this order',
    '— ไม่มีเมนูที่เพิ่มได้ —': '— No items available to add —',
    'ล็อกอิน': 'Log in', 'สั่งเป็นแขก (กรอกเบอร์โทร)': 'Order as guest (phone required)',

    /* ออเดอร์ของฉัน */
    'ดูออเดอร์ของฉัน — สำหรับสมาชิก': 'My orders — for members', 'ดูออร์เดอร์ของฉัน — สำหรับสมาชิก': 'My orders — for members',
    'ดูออร์เดอร์ของฉัน — สำหรับสมาชิก': 'My orders — for members',
    'ติดตามสถานะออเดอร์แบบเรียลไทม์ — ร้านอัปเดตทุกขั้นตอน': 'Track your orders live — the shop updates every step', 'ติดตามสถานะออร์เดอร์แบบเรียลไทม์ — ร้านอัปเดตทุกขั้นตอน': 'Track your orders live — the shop updates every step',
    'ติดตามสถานะออร์เดอร์แบบเรียลไทม์ — ร้านอัปเดตทุกขั้นตอน': 'Track your orders live — the shop updates every step',
    'เข้าสู่ระบบด้วยเบอร์โทรเพื่อดูออเดอร์ทั้งหมดของคุณและติดตามสถานะแบบเรียลไทม์': 'Log in with your phone to see all your orders and track them live', 'เข้าสู่ระบบด้วยเบอร์โทรเพื่อดูออร์เดอร์ทั้งหมดของคุณและติดตามสถานะแบบเรียลไทม์': 'Log in with your phone to see all your orders and track them live',
    'เข้าสู่ระบบด้วยเบอร์โทรเพื่อดูออร์เดอร์ทั้งหมดของคุณและติดตามสถานะแบบเรียลไทม์': 'Log in with your phone to see all your orders and track them live',
    '📝 สมัครฟรีด้วยเบอร์โทร': '📝 Sign up free with phone',
    'ยังไม่มีออเดอร์': 'No orders yet', 'ยังไม่มีออร์เดอร์': 'No orders yet',
    'ยังไม่มีออร์เดอร์': 'No orders yet',
    'เลือกตลาดและร้านโปรด แล้วสั่งอาหารสด ๆ ได้เลย': 'Pick a market and your favorite shop, then order fresh',
    'เริ่มสั่งอาหาร': 'Start ordering',
    'ออเดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ': 'orders in progress — this page updates automatically', 'ออร์เดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ': 'orders in progress — this page updates automatically',
    'ออร์เดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ': 'orders in progress — this page updates automatically',
    'สั่งเมื่อ': 'Ordered', 'ออเดอร์': 'Order', 'ออเดอร์ #': 'Order #', 'ออร์เดอร์': 'Order', 'ออร์เดอร์ #': 'Order #',
    'โหลดออเดอร์ไม่สำเร็จ': 'Could not load orders', 'โหลดออร์เดอร์ไม่สำเร็จ': 'Could not load orders',
    'โหลดออร์เดอร์ไม่สำเร็จ': 'Could not load orders',
    'ร้านกำลังดูออเดอร์': 'Shop is reviewing', 'กำลังทำอยู่': 'Preparing', 'ร้านกำลังดูออร์เดอร์': 'Shop is reviewing',
    'พร้อมรับแล้ว 🎉': 'Ready for pickup 🎉', 'เสร็จสิ้น': 'Completed',
    'ออเดอร์ของแขก': 'Guest order', 'รหัสติดตาม': 'Tracking code', 'ออร์เดอร์ของแขก': 'Guest order',

    /* สถานะ / ประเภท / ชำระเงิน */
    'รอดำเนินการ': 'Pending', 'กำลังอบ/กำลังทำ': 'Preparing',
    'พร้อมรับ/ส่ง': 'Ready', 'เสร็จสิ้น': 'Completed',
    'อาหาร/เครื่องดื่ม': 'Food & drinks', 'เสื้อผ้า': 'Clothes',
    'ของสด': 'Fresh produce', 'ทั่วไป': 'General',
    'เงินสด': 'Cash', 'สแกน PromptPay': 'PromptPay',
    'โอนเงิน': 'Bank transfer', 'ชำระแล้ว': 'Paid', 'ค้างชำระ': 'Unpaid',
    '✓ ชำระแล้ว': '✓ Paid', 'ยังไม่ชำระ': 'Unpaid', 'ไม่มา': 'Absent',
    'มาแล้ว': 'Present', 'ว่าง': 'Vacant', 'เปิดรับผู้เช่า': 'Available',
    'เข้าอยู่': 'Occupied', 'ผู้เช่า': 'Vendor', 'วัน': 'day',

    /* ผจก. — แดชบอร์ด */
    'ระบบจัดการตลาด': 'Market management',
    'ล็อคแผง ค่าเช่า และสถานะชำระเงินรายวัน': 'Stalls, rent, and daily payment status',
    'รายได้รวม': 'Total revenue', 'ล็อคทั้งหมด': 'All lots', 'ค้างชำระ': 'Unpaid',
    'รายได้วันนี้': 'Revenue today', 'ค่าเช่าวันนี้': 'Rent today',
    'รายรับ': 'Revenue', 'จากผู้เช่า': 'from vendors',
    'ยังไม่มีตลาดในระบบ': 'No markets yet',
    'สร้างตลาดแรกของคุณเพื่อเริ่มจัดการล็อคและร้านค้า': 'Create your first market to start managing lots and shops',
    '＋ สร้างตลาดใหม่': '＋ Create market',
    'เลือกตลาดที่คุณดูแล': 'Choose your market',
    'แตะเพื่อเข้าไปจัดการ หรือสร้างตลาดใหม่': 'Tap to manage, or create a new market',
    'จัดการตลาดของคุณ': 'Manage your market',
    'เปลี่ยนตลาด': 'Switch market', 'เลือกตลาด': 'Choose market',
    'แตะเพื่อเปลี่ยนวันที่': 'Tap to change date',
    'เลือกวันที่ใช้งาน': 'Pick the working date',
    'จุดสีเขียว = วันที่มีรายการชำระเงิน': 'Green dot = days with payments',
    'ใช้วันนี้': 'Today', 'เดือนก่อนหน้า': 'Previous month', 'เดือนถัดไป': 'Next month',
    'รายได้เก็บได้จริง (บาท)': 'Actual collected revenue (THB)',
    'รายรับค่าเช่า-ค่าบริการ': 'Rent & service revenue',
    'จากผู้เช่าล็อค': 'from lot vendors',
    'ผังล็อค': 'Lot map', 'ประวัติการชำระเงิน': 'Payment history',
    'ช่วง:': 'Range:', 'รายวัน': 'Daily', 'รายสัปดาห์': 'Weekly', 'รายเดือน': 'Monthly',
    'ยังไม่มีการชำระเงิน': 'No payments yet',
    'เนื่องจากยังไม่มีผู้เช่าในล็อคนี้': 'because this lot has no vendor yet',
    'ยังไม่บันทึกรายได้จนกว่าจะสลับเป็นชำระแล้ว': 'Revenue is not recorded until marked as paid',
    'ยืนยันการเคลียร์ข้อมูลล็อค?': 'Clear this lot’s data?',
    'ลบข้อมูล': 'Clear data',
    'ยืนยันการเปลี่ยนวันที่ใช่หรือไม่?': 'Change the working date?',
    'ชื่อล็อค': 'Lot label', 'ชื่อล็อค (ป้ายกำหนดเอง)': 'Lot label (custom badge)',
    'ค่าเช่ามาตรฐานของล็อคนี้': 'Standard rent for this lot',
    'ถ้าเว้นว่าง = ล็อคนี้ไม่มีผู้เช่า': 'Leave blank = this lot is vacant',
    'ชื่อร้านค้า/ผู้เช่า': 'Vendor / shop name',
    'ประเภท': 'Category', 'การมาทำการ': 'Attendance', 'มาทำการ': 'Attendance',
    'สถานะการชำระ': 'Payment status', 'วิธีชำระ': 'Payment method',
    'ยืนยันการลบออเดอร์?': 'Delete this order?', 'ลบออเดอร์': 'Delete order', 'ยืนยันการลบออร์เดอร์?': 'Delete this order?', 'ลบออร์เดอร์': 'Delete order',

    /* ผจก. — ร้านค้า / ตั้งค่า */
    'เพิ่มร้านค้าใหม่': '＋ Add shop', 'ข้อมูลนี้ลูกค้าจะเห็นในแอปลูกค้า (ติดต่อ + เมนู)': 'Customers see this in their app (contact + menu)',
    'บันทึกการแก้ไข': 'Save changes', 'เพิ่มร้านค้า': 'Add shop',
    'กรุณากรอกชื่อร้าน': 'Please enter a shop name',
    'แก้ไขข้อมูลร้าน': 'Edit shop info',
    'ช่องทางติดต่อ (ลูกค้ากดติดต่อได้จากแอป)': 'Contact channels (tap-to-contact in customer app)',
    'ยืนยันการลบร้าน?': 'Delete this shop?',
    'ลบร้าน': 'Delete shop', 'คำอธิบายร้าน': 'Shop description',
    'ข้อมูลตลาด เวลาเปิด และผังแถวล็อค': 'Market info, hours, and lot rows',
    'บันทึกข้อมูลตลาดแล้ว': 'Market info saved',
    'กำหนดจำนวนแถว จำนวนล็อคต่อแถว และค่าเช่ามาตรฐาน — แถวหนึ่งใช้ตัวอักษรกำกับ (A, B, C…)':
      'Set the number of rows, lots per row, and standard rent — each row is a letter (A, B, C…)',
    'บันทึกผังตลาดใหม่?': 'Save the new lot layout?',
    'ล็อคที่ถูกลบออก จะลบประวัติการเช่า/ชำระของล็อคนั้นด้วย — ล็อคที่ยังอยู่จะคงข้อมูลเดิมไว้':
      'Removed lots also lose their rent/payment history — remaining lots keep their data',
    'บันทึกผัง': 'Save layout', 'ต้องมีอย่างน้อย 1 แถว': 'Need at least 1 row',
    '＋ เพิ่มแถว': '＋ Add row', 'ลบแถวนี้': 'Delete this row', 'ลบแถว': 'Delete row',
    'ลดจำนวนล็อค': 'Fewer lots', 'เพิ่มจำนวนล็อค': 'More lots',
    'ค่าเช่าต่อล็อค': 'Rent per lot', 'ค่าเช่าต่อล็อค (บาท)': 'Rent per lot (THB)',
    'กด "＋ เพิ่มแถว" เพื่อเริ่มสร้างผังตลาด': 'Tap “＋ Add row” to start the layout',
    'วันเปิดทำการ': 'Open days', 'เวลาเปิด': 'Opening time', 'เวลาปิด': 'Closing time',
    'เวลาเปิด-ปิด': 'Opening–closing hours',
    'ตลาดนี้เปิดวันไหน เวลาอะไร — ลูกค้าเห็นในแอปทันที และระบบเปลี่ยนป้าย เปิด/ปิดวันนี้ ให้เองตามวัน':
      'Which days & hours this market opens — customers see it instantly and the Open/Closed badge follows the schedule',
    'ตามตาราง': 'Follow schedule', 'สถานะวันนี้': 'Today’s status',
    'บันทึกตาราง': 'Save schedule', 'ตอนนี้แสดงเป็น:': 'Currently shown as:',
    'เปิดทุกวัน': 'Open every day', 'ไม่ระบุวัน': 'No days set',
    'อัปเดตแล้ว': 'Updated', 'ประกาศจากตลาด': 'Market announcement',
    'ข้อความถึงลูกค้า เช่น ปิดเทศกาล เปลี่ยนสถานที่ชั่วคราว': 'Message to customers, e.g. holiday closure or temporary relocation',
    'ที่อยู่': 'Address', 'พิกัด (ละติจูด, ลองจิจูด)': 'Coordinates (lat, lng)',
    'ใช้ตำแหน่งปัจจุบันของฉัน': 'Use my current location',
    'ร้านค้าในตลาดของคุณ': 'Shops in your market',
    'ทะเบียนร้าน ช่องทางติดต่อ และการเปิดรับออเดอร์': 'Shop registry, contacts, and order acceptance', 'ทะเบียนร้าน ช่องทางติดต่อ และการเปิดรับออร์เดอร์': 'Shop registry, contacts, and order acceptance',
    'ทะเบียนร้าน ช่องทางติดต่อ และการเปิดรับออร์เดอร์': 'Shop registry, contacts, and order acceptance',

    /* ร้านค้า (vendor) */
    'เลือกร้านของคุณ': 'Choose your shop',
    'แตะเพื่อเข้าไปจัดการร้าน หรือเปิดร้านใหม่ในตลาด': 'Tap to manage a shop, or open a new one',
    'เปิดร้านใหม่': 'Open new shop', '⇄ เปลี่ยนร้าน': '⇄ Switch shop',
    'ยังไม่มีร้านค้าในระบบ': 'No shops yet', 'กด "เปิดร้านใหม่" เพื่อเริ่มต้น': 'Tap “Open new shop” to get started',
    'เลือกตลาด ตั้งชื่อร้าน แล้วเพิ่มเมนูได้เลย': 'Pick a market, name your shop, then add menu items',
    '🟢 เปิดรับออเดอร์': '🟢 Accepting orders', '🔴 ปิดร้านชั่วคราว': '🔴 Temporarily closed', '🟢 เปิดรับออร์เดอร์': '🟢 Accepting orders',
    'เปิดร้าน': 'Open shop', 'เปิดร้านได้เฉพาะในตลาดที่คุณดูแล': 'You can only open shops in your own market',
    'ตั้งค่าร้านของคุณ': 'Set up your shop',
    'ตลาดที่จะตั้งแผง': 'Market to set up in', 'ตลาดที่ดูแล': 'Your market',
    '— ยังไม่มีตลาด —': '— No markets —',
    'ยังไม่มีตลาดให้เปิดร้าน — รอแอดมินเพิ่มตลาดก่อนนะคะ': 'No markets to open a shop in yet — waiting for the admin to add one',
    'กรุณาตั้งชื่อร้าน': 'Please name your shop',
    'ยืนยันเสร็จสิ้น (ส่งของถึงลูกค้าแล้ว)': 'Confirm completed (handed to customer)',
    'เพิ่มออเดอร์': 'Add order', 'รายการอาหาร': 'Order items', 'เพิ่มออร์เดอร์': 'Add order',
    'เพิ่มเมนูสินค้าใหม่': '＋ New menu item', 'เพิ่มเมนู': 'Add item',
    'ใส่รูปจริงของอาหาร หรือเลือกอิโมจิแทนได้': 'Add a real photo, or pick an emoji instead',
    'ลบรูป': 'Remove photo', 'ใส่รูปเรียบร้อย': 'Photo added',
    'ชื่อเมนู': 'Item name', 'กรุณากรอกชื่อเมนู': 'Please enter the item name',
    'กรุณากรอกราคาให้ถูกต้อง': 'Please enter a valid price',
    'ราคาไม่ถูกต้อง (0 – 1,000,000)': 'Invalid price (0 – 1,000,000)',
    '● พร้อมขาย': '● Available', '● สินค้าหมด': '● Sold out',
    'พร้อมขาย': 'Available', 'สถานะการขาย': 'Sales status',
    'ยืนยันการลบเมนู?': 'Delete this item?', 'ลบเมนู': 'Delete item',
    'ยังไม่มีเมนู': 'No menu items yet',
    'กดปุ่ม “เพิ่มเมนูสินค้าใหม่” ด้านบนเพื่อเริ่ม': 'Tap “＋ New menu item” above to start',
    'สต็อก': 'Stock', 'จำนวนสต็อก': 'Stock count',
    'เว้นว่าง = ขายได้ไม่จำกัด': 'Leave blank = unlimited',
    'เหลือ': 'left', 'ชิ้น': 'pcs', 'กรุณาเลือกไฟล์รูปภาพ': 'Please choose an image file',
    'อ่านไฟล์ไม่สำเร็จ': 'Could not read the file', 'ไฟล์รูปไม่ถูกต้อง': 'Invalid image file',
    'บันทึกข้อมูลร้านเรียบร้อย': 'Shop info saved',
    'แก้ไขรายละเอียด': 'Edit details', 'ออเดอร์จากแอป': 'App order', 'ลูกค้าหน้าร้าน': 'Walk-in customer', 'ออร์เดอร์จากแอป': 'App order',
    '📱 แอป': '📱 App', 'โต๊ะ': 'Table',

    /* แอดมิน */
    'สร้างตลาดใหม่': 'Create market', 'กรอกข้อมูลพื้นฐาน — แก้ไขเพิ่มเติมได้ที่ "ตั้งค่าตลาด"': 'Enter the basics — refine later in “Market settings”',
    'ชื่อตลาด': 'Market name', 'กรุณากรอกชื่อตลาด': 'Please enter the market name',
    'คำอธิบาย': 'Description', 'เวลาเปิดทำการ': 'Opening hours',
    'รูปแบบเวลาเปิดต้องเป็น HH:MM เช่น 16:00': 'Opening time must be HH:MM, e.g. 16:00',
    'รูปแบบเวลาปิดต้องเป็น HH:MM เช่น 23:00': 'Closing time must be HH:MM, e.g. 23:00',
    'กรอกเวลาเปิดและเวลาปิดให้ครบคู่กัน': 'Enter both opening and closing times',
    'ยอดขายวันนี้ (ทุกตลาด)': 'Today’s sales (all markets)',
    'ค่าเช่า-ค่าบริการวันนี้': 'Rent & fees today',
    'ยอดขายสะสม': 'All-time sales', 'รายได้ค่าเช่าสะสม': 'All-time rent income',
    'ลูกค้าสมาชิก': 'Member customers', 'ฐานข้อมูลการตลาดของคุณ': 'Your marketing database',
    'ออเดอร์วันนี้': 'Orders today', 'ยอดขายวันนี้': 'Sales today', 'ค่าเช่าวันนี้': 'Rent today', 'ออร์เดอร์วันนี้': 'Orders today',
    'ทุกตลาดในมือเดียว': 'Every market in one place',
    'รายตลาด — วันนี้': 'Per market — today',
    'ออเดอร์ล่าสุด': 'Recent orders', 'สมาชิกใหม่ล่าสุด': 'Newest members', 'ออร์เดอร์ล่าสุด': 'Recent orders',
    'บัญชีผู้ใช้ทั้งหมด': 'All user accounts',
    'ผู้จัดการ · ร้านค้า · ลูกค้า · แอดมิน': 'Managers · vendors · customers · admins',
    'สร้างบัญชีใหม่': '＋ New account',
    'เปลี่ยนชื่อ / ตลาด / รีเซ็ตรหัสผ่าน': 'Rename / reassign / reset password',
    'บัญชีผู้จัดการตลาด หรือ ร้านค้า (สร้างให้ทีมงานของคุณ)': 'Market-manager or vendor account (for your team)',
    'รีเซ็ตรหัสผ่าน (เว้นว่าง = ไม่เปลี่ยน)': 'Reset password (blank = keep)',
    'สร้างบัญชี': 'Create account',
    'ลบบัญชี': 'Delete account', 'ลบบัญชีแล้ว': 'Account deleted',
    'บัญชีนี้จะไม่สามารถเข้าสู่ระบบได้อีก (ออเดอร์ที่เคยผูกไว้ยังคงอยู่ในประวัติ)': 'This account will no longer be able to log in (past orders stay in history)', 'บัญชีนี้จะไม่สามารถเข้าสู่ระบบได้อีก (ออร์เดอร์ที่เคยผูกไว้ยังคงอยู่ในประวัติ)': 'This account will no longer be able to log in (past orders stay in history)',
    'บัญชีนี้จะไม่สามารถเข้าสู่ระบบได้อีก (ออร์เดอร์ที่เคยผูกไว้ยังคงอยู่ในประวัติ)': 'This account will no longer be able to log in (past orders stay in history)',
    'ไม่พบบัญชีประเภทนี้': 'No accounts of this type',
    'ฐานข้อมูลลูกค้า': 'Customer database',
    'พลังการตลาดของคุณ — สมาชิกจากทุกตลาดทุกร้าน': 'Your marketing power — members from every market & shop',
    'ยังไม่มีสมาชิกลูกค้า': 'No member customers yet',
    'ลูกค้าจะสมัครอัตโนมัติเมื่อสั่งออเดอร์ครั้งแรก': 'Customers register automatically on their first order', 'ลูกค้าจะสมัครอัตโนมัติเมื่อสั่งออร์เดอร์ครั้งแรก': 'Customers register automatically on their first order',
    'ลูกค้าจะสมัครอัตโนมัติเมื่อสั่งออร์เดอร์ครั้งแรก': 'Customers register automatically on their first order',
    'ดาวน์โหลดไฟล์ลูกค้า (CSV) แล้ว — เปิดได้ด้วย Excel': 'Customer CSV downloaded — opens in Excel',
    'ลบถาวร': 'Delete permanently',
    'ล็อค ร้านค้า เมนู ออเดอร์ และข้อมูลการเงินของตลาดนี้ จะถูกลบทั้งหมด — ไม่สามารถย้อนกลับได้':
      'All lots, shops, menus, orders, and financial data of this market will be permanently deleted',
    'เฉพาะแอดมินที่สร้างตลาดใหม่ได้ — ติดต่อผู้ดูแลระบบ': 'Only the admin can create markets — contact the system owner',
    'คุณเป็นเจ้าของทุกตลาด — เพิ่ม/ลบ/แก้ไขได้ตลอดเวลา และมอบบัญชีผู้จัดการให้คนที่คุณไว้ใจ':
      'You own every market — add/remove/edit anytime and hand manager accounts to people you trust',
    'ผู้จัดการ': 'Manager', 'แอดมิน': 'Admin', 'บทบาท': 'Role', 'วันสมัคร': 'Joined',
    'เข้าสู่ระบบล่าสุด': 'Last login', 'ตลาดที่ดูแล': 'Managed market', 'ร้านที่ผูกไว้': 'Linked shop',
    'จำนวนออเดอร์': 'Orders', 'ยอดใช้จ่ายรวม (บาท)': 'Total spend (THB)', 'จำนวนออร์เดอร์': 'Orders',
    'ออเดอร์': 'Order', 'สมาชิกใหม่': 'New member', 'ออร์เดอร์': 'Order',

    /* บันทึกกิจกรรม (audit) */
    'บันทึกกิจกรรม': 'Activity log', 'ทุกการกระทำของทุกบทบาท — เปิดเผยต่อแอดมินเท่านั้น': 'Every action by every role — visible to admins only',
    'เวลา': 'Time', 'ผู้กระทำ': 'Actor', 'การกระทำ': 'Action', 'ตลาด': 'Market',
    'ทุกบทบาท': 'All roles', '🌍 ทุกตลาด': '🌍 All markets',
    'ไม่มีบันทึก': 'No activity yet', 'ไม่พบรายการ': 'No matching entries',
    'ดาวน์โหลด CSV': 'Download CSV', 'พิมพ์รายงาน': 'Print report',
    'ส่งออก CSV': 'Export CSV', '🖨 รายงาน': '🖨 Report',

    /* ชีตบัญชี / ล็อคหน้าจอ */
    'บัญชีของฉัน': 'My account', 'ข้อมูลของ': 'Account of',
    'ตั้งแต่สมัคร': 'Member since', 'สมาชิกตั้งแต่': 'Member since',
    'เปลี่ยนรหัสผ่าน': 'Change password', 'รหัสผ่านปัจจุบัน': 'Current password',
    'รหัสผ่านใหม่': 'New password', 'ยืนยันรหัสผ่านใหม่': 'Confirm new password',
    'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน': 'New passwords don’t match',
    'กรอกรหัสผ่านให้ครบ': 'Please fill in all password fields',
    'รหัสผ่านเดิมไม่ถูกต้อง': 'Current password is incorrect',
    'รหัสล็อคหน้าจอ': 'Screen lock passcode',
    'ตั้งรหัสล็อค': 'Set passcode', 'เปลี่ยนรหัสล็อค': 'Change passcode',
    'ลบรหัสล็อค': 'Remove passcode',
    'รหัสล็อค (ตัวเลข 4–8 หลัก)': 'Passcode (4–8 digits)',
    'กรอกรหัสผ่านบัญชีเพื่อยืนยัน': 'Enter your account password to confirm',
    'เปิดใช้งานอยู่ — แอปจะขอรหัสทุกครั้งที่เปิดใหม่': 'Enabled — the app asks for the passcode on every launch',
    'ยังไม่ได้ตั้ง — ตั้งเพื่อล็อคหน้าจอเวลาเปิดแอป (ตัวเลข 4–8 หลัก)': 'Not set — lock the app on launch with a 4–8 digit passcode',
    'TalatSuite ถูกล็อค': 'TalatSuite is locked',
    'กรอกรหัสล็อคเพื่อเข้าใช้งานต่อ': 'Enter your passcode to continue',
    'ปลดล็อค': 'Unlock', 'ปลดล็อคแล้ว ยินดีต้อนรับกลับ': 'Unlocked — welcome back',
    'รหัสล็อคไม่ถูกต้อง': 'Incorrect passcode',
    'ภาษา / Language': 'ภาษา / Language',

    /* สถานะระบบ */
    'เชื่อมต่อ PostgreSQL แล้ว': 'PostgreSQL connected', 'ฐานข้อมูลออฟไลน์': 'Database offline',
    'ออนไลน์': 'Online', 'ออฟไลน์': 'Offline',
    'กำลังตรวจสอบฐานข้อมูล…': 'Checking database…',
    'โหมดออฟไลน์ · ข้อมูลเก็บในเครื่องนี้': 'Offline mode · data stored on this device',
    'โหมดพรีวิว · ไม่บันทึกถาวร': 'Preview mode · nothing is saved',
    '↺ รีเซ็ตข้อมูลตัวอย่าง': '↺ Reset demo data',

    /* เดือนเต็ม */
    'มกราคม': 'January', 'กุมภาพันธ์': 'February', 'มีนาคม': 'March', 'เมษายน': 'April',
    'พฤษภาคม': 'May', 'มิถุนายน': 'June', 'กรกฎาคม': 'July', 'สิงหาคม': 'August',
    'กันยายน': 'September', 'ตุลาคม': 'October', 'พฤศจิกายน': 'November', 'ธันวาคม': 'December',

    /* ข้อความระบบ / toast */
    'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง': 'Session expired — please log in again',
    'รับออเดอร์': 'Orders', 'กรุณากรอกชื่อ': 'Please enter your name', 'รับออร์เดอร์': 'Orders',
    'กรุณากรอกเบอร์โทร': 'Please enter your phone number',
    'กรุณาตั้งชื่อผู้ใช้': 'Please choose a username',
    'รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร': 'Password must be at least 4 characters',
    'กรุณากรอกชื่อ เบอร์โทร และรหัสผ่าน (4 ตัวขึ้นไป)': 'Please enter name, phone, and password (4+ characters)',
    'ใหม่': 'new', 'ก่อน': 'first', 'ลองใหม่อีกครั้ง': 'Please try again',
    'เปลี่ยนรหัสผ่านเรียบร้อย — เครื่องอื่นถูกออกจากระบบแล้ว': 'Password changed — other devices were logged out',
    'รหัสล็อคต้องเป็นตัวเลข 4–8 หลัก': 'Passcode must be 4–8 digits',
    'ตั้งรหัสล็อคหน้าจอเรียบร้อย': 'Screen-lock passcode set',
    'อัปเดตรหัสล็อคเรียบร้อย': 'Passcode updated',
    'ลบรหัสล็อคหน้าจอแล้ว': 'Screen-lock passcode removed',
    'ปลดล็อคแล้ว ยินดีต้อนรับกลับ 👋': 'Unlocked — welcome back 👋',
    ' — ลองอีกครั้ง': ' — try again',
    'ชำระเงินแล้ว': 'Paid', 'ไม่ระบุชื่อ': 'Unnamed', 'ไม่ระบุล็อค': 'No lot set',
    'อาหาร': 'Food',
    '🌙 ตลาดนี้ปิดทำการวันนี้ — ดูเมนูได้ แต่ยังสั่งไม่ได้': '🌙 This market is closed today — menus are viewable, ordering is disabled',
    'กรุณากรอกชื่อของคุณ (ร้านใช้เรียกตอนอาหารพร้อม)': 'Please enter your name (the shop calls it when ready)',
    'ตลาดนี้': 'this market', 'บัญชีนี้': 'this account',
    '🏪 ผู้จัดการ': '🏪 Manager', '🍜 ร้านค้า': '🍜 Vendor', '🛒 ลูกค้า': '🛒 Customer',
    'เปลี่ยนร้าน': 'Switch shop', 'เปลี่ยนวันที่': 'Change date',
    'ย้ายไปขั้นก่อนหน้า': 'Move to previous stage', 'ย้ายไปขั้นถัดไป': 'Move to next stage',
    'พร้อมขาย/สินค้าหมด': 'Available / sold out',
    'ผู้จัดการตลาด · ร้านค้า · ลูกค้าสมาชิก · แอดมิน': 'Market manager · vendor · member · admin',
    'ยอดใช้จ่ายรวม': 'Total spend', 'ยอดใช้จ่ายรวม (บาท)': 'Total spend (THB)',
    'ยังไม่มีรายการชำระเงินในช่วงนี้': 'No payments in this range',
    'ยังไม่มีสมาชิก': 'No members yet', 'ยังไม่มีเมนูในระบบ': 'No menu items yet',
    'ยังไม่มีแถวล็อค': 'No lot rows yet',
    'ยังไม่ได้เลือกอาหาร — แตะ “＋” ที่เมนูด้านบน': 'Nothing selected yet — tap “＋” on a menu item above',
    'ยืนยันด้วยรหัสผ่านบัญชี': 'Confirm with your account password',
    'รหัสผ่านใหม่ (4 ตัวขึ้นไป)': 'New password (4+ characters)',
    'รหัสผ่านปัจจุบันของบัญชี': 'Current account password',
    'ราคา (บาท)': 'Price (THB)', 'ค่าเช่าของวันนี้ (บาท)': 'Today’s rent (THB)',
    'รูปจะถูกย่ออัตโนมัติ — ลูกค้าเห็นรูปนี้ตอนสั่งอาหาร': 'Images are resized automatically — customers see this photo when ordering',
    'รูปถ่ายเมนู (ถ้ามี)': 'Menu photo (optional)',
    'ร้านค้า (ไม่บังคับ — ผูกภายหลังได้)': 'Shop (optional — can link later)',
    'ลองเปลี่ยนช่วงเวลา หรือบันทึกการชำระจากล็อคที่มีผู้เช่า': 'Try a different date range, or record payments from occupied lots',
    'ลากบัตร (กดค้างแล้วลาก) หรือใช้ปุ่ม ◀ ▶ เพื่อย้ายสถานะ · แตะบัตรเพื่อแก้ไขรายละเอียด · การ์ดที่ลูกค้าสั่งจากแอปมีป้าย 📱':
      'Drag cards (press & hold) or use ◀ ▶ to change status · tap a card to edit details · app orders carry a 📱 badge',
    'ลูกค้ากดปุ่มติดต่อคุณได้จากหน้าร้านในแอป': 'Customers can tap contact buttons on your shop page',
    'ลูกค้าข้ามตลาด': 'cross-market customers',
    'ลูกค้าจะเห็นข้อมูลนี้ตอนเข้าดูร้านในแอปลูกค้า': 'Customers see this info when viewing your shop',
    'ล็อคที่ตั้งแผง (ถ้ามี)': 'Your lot (if any)', 'ล็อคที่ตั้งแผง (ถ้ารู้ ไม่บังคับ)': 'Lot code (optional, if known)',
    'ล็อคที่มีผู้เช่าจะแสดงชื่อร้านในผังตลาดได้': 'Occupied lots can show the shop name on the market map',
    'วิธีชำระเงิน': 'Payment method', 'สถานะชำระเงิน': 'Payment status',
    'สถานะออเดอร์': 'Order status', 'สมาชิกทั้งหมด': 'All members', 'สถานะออร์เดอร์': 'Order status',
    'สร้างตลาด': 'Create market',
    'สร้างร้านแล้วระบบจะพาไปเลือกล็อคในตลาด และเพิ่มเมนูรายการแรกของคุณ': 'After creating the shop you’ll pick a lot and add your first menu item',
    'ส่งออกเป็นไฟล์ CSV เปิดได้ใน Excel/Google Sheets เพื่อทำการตลาดต่อ (LINE Broadcast, SMS ฯลฯ)': 'Export a CSV that opens in Excel/Google Sheets for marketing (LINE Broadcast, SMS, etc.)',
    'หมวดหมู่ (ไม่บังคับ)': 'Category (optional)', 'หมายเหตุถึงครัว': 'Note to kitchen',
    'ออกจากตลาด? เมนูและออเดอร์ทั้งหมดของร้านจะถูกลบด้วย': 'Leave this market? All the shop’s menus and orders will be deleted too', 'ออกจากตลาด? เมนูและออร์เดอร์ทั้งหมดของร้านจะถูกลบด้วย': 'Leave this market? All the shop’s menus and orders will be deleted too',
    'ออกจากตลาด? เมนูและออร์เดอร์ทั้งหมดของร้านจะถูกลบด้วย': 'Leave this market? All the shop’s menus and orders will be deleted too',
    'ออกจากเมนู? (ออเดอร์เก่าที่สั่งไปแล้วจะยังคงประวัติไว้)': 'Remove this item? (past orders keep their history)', 'ออกจากเมนู? (ออร์เดอร์เก่าที่สั่งไปแล้วจะยังคงประวัติไว้)': 'Remove this item? (past orders keep their history)',
    'ออกจากเมนู? (ออร์เดอร์เก่าที่สั่งไปแล้วจะยังคงประวัติไว้)': 'Remove this item? (past orders keep their history)',
    'อิโมจิประจำตลาด': 'Market emoji', 'อิโมจิประจำร้าน': 'Shop emoji',
    'เข้าชมตลาด & สั่งอาหาร': 'Browse markets & order food',
    'เคลียร์ข้อมูลล็อค': 'Clear lot data', 'เช็คอินการมาขาย': 'Vendor attendance check-in',
    'เบอร์ติดต่อลูกค้า (ถ้ามี)': 'Customer phone (if any)',
    'เบอร์โทร': 'Phone', 'เบอร์โทร (ใช้เข้าสู่ระบบ)': 'Phone number (your login)',
    'เบอร์โทร / ชื่อผู้ใช้': 'Phone / username',
    'เปลี่ยนวันที่ที่ใช้งานเป็น': 'Change working date to',
    'เปลี่ยนแล้วทุกเครื่องที่เข้าอยู่จะถูกออกจากระบบ ยกเว้นเครื่องนี้': 'After changing, all other devices are logged out except this one',
    'เปิดร้านรับออเดอร์': 'Accepting orders', 'เปิดร้านรับออร์เดอร์': 'Accepting orders',
    'เปิดร้านรับออร์เดอร์': 'Accepting orders',
    'เพียง 3 ขั้นตอน — เลือกตลาด · ตั้งชื่อร้าน · เลือกล็อค': 'Just 3 steps — pick market · name shop · pick lot',
    'เลือกตลาดที่จะเปิดร้าน': 'Choose a market for your shop',
    'แตะล็อคเพื่อแก้ไขข้อมูล': 'Tap a lot to edit its data',
    'แตะเลือกวันที่ตลาดเปิด — ลูกค้าจะเห็นป้าย "เปิดวันนี้ / ปิดวันนี้" ตามวันจริง': 'Pick the market’s open days — customers see the Open/Closed badge accordingly',
    'แพลตฟอร์มตลาดสำหรับทุกคน — ผู้จัดการ · ร้านค้า · ลูกค้า': 'A market platform for everyone — managers · vendors · customers',
    'แสดงเป็นป้ายเล็กบนการ์ดล็อค — เว้นว่างได้': 'Shows as a small badge on the lot card — can be blank',
    'โหลดข้อมูลตลาดไม่สำเร็จ': 'Could not load market data',
    'โหลดข้อมูลร้านไม่สำเร็จ': 'Could not load shop data',
    'โหลดประวัติไม่สำเร็จ': 'Could not load history',
    'โหลดรายชื่อร้านไม่สำเร็จ': 'Could not load shops',
    'โหลดสถิติไม่สำเร็จ': 'Could not load stats',
    'โหลดไม่สำเร็จ': 'Load failed',
    'ใช่หรือไม่?': 'Are you sure?',
    'ไปที่แท็บ “เมนูสินค้า” เพื่อเพิ่มเมนูแรกของร้าน': 'Go to the “Menu” tab to add your first item',
    'ไม่มาขาย (แถบลาย)': 'Absent (striped)', '✓ มา': '✓ Present', '✕ ไม่มา': '✕ Absent',
    'ไอคอนของเมนู (ใช้เมื่อไม่มีรูป)': 'Item icon (used when no photo)',
    '— ยังไม่ผูกร้าน —': '— No shop linked —',
    '— เดินดูร้านและเมนูได้ แต่ยังสั่งอาหารไม่ได้': '— browse shops & menus, ordering disabled',
    '— เลือกตลาด —': '— Choose a market —',
    '⏻ ออกจากระบบ': '⏻ Log out',
    '⬇️ ส่งออก CSV': '⬇️ Export CSV',
    '＋ สร้างบัญชี (ผจก./ร้านค้า)': '＋ Create account (manager/vendor)',
    '＋ เปิดร้านใหม่': '＋ Open new shop', '＋ เพิ่ม': '＋ Add',
    '＋ เพิ่มร้านค้าใหม่': '＋ Add new shop', '＋ เพิ่มเมนูสินค้าใหม่': '＋ New menu item',
    '🆕 สมาชิกใหม่ล่าสุด': '🆕 Newest members',
    '🌙 ตลาดนี้': '🌙 This market', '🍕 เมนูของร้าน': '🍕 Shop menu', '🍕 เมนูสินค้า': '🍕 Menu',
    '🏠 หน้าหลัก': '🏠 Home', '🏪 ข้อมูลร้าน': '🏪 Shop info',
    '🏪 ผู้จัดการตลาด': '🏪 Market manager', '🏪 ร้านของฉัน': '🏪 My shop',
    '👥 ลูกค้าสมาชิก': '👥 Member customers',
    '💡 แตะที่รายการเพื่อแก้ไขละเอียด (ชื่อ ราคา รูปภาพ อิโมจิ) · แก้ราคาได้ทันทีในช่องราคา · สลับ "พร้อมขาย/สินค้าหมด" ได้ทุกเมื่อ':
      '💡 Tap an item to edit details (name, price, photo, emoji) · edit price inline · toggle Available/Sold out anytime',
    '💵 เงินสด': '💵 Cash', '📅 ตามตาราง': '📅 Follow schedule',
    '📊 รายตลาด — วันนี้': '📊 Per market — today', '📋 ข้อมูลตลาด': '📋 Market info',
    '📝 สมัครใหม่ด้วยเบอร์โทร': '📝 Sign up with phone',
    '📞 ช่องทางติดต่อของร้าน': '📞 Shop contact channels',
    '📱 สแกน PromptPay': '📱 PromptPay', '📷 เลือกรูป': '📷 Choose photo',
    '🔑 เปลี่ยนรหัสผ่าน': '🔑 Change password', '🔒 รหัสล็อคหน้าจอ': '🔒 Screen-lock passcode',
    '🔥 คิวครัว': '🔥 Kitchen queue', '🔴 สถานะ:': '🔴 Status:', '🟠 สถานะ:': '🟠 Status:', '🟢 สถานะ:': '🟢 Status:',
    '🗓️ ตารางเปิดทำการ': '🗓️ Opening schedule',
    '🚀 สร้างร้านของฉัน': '🚀 Create my shop', '🚀 ส่งออเดอร์เข้าคิว': '🚀 Send order to queue', '🚀 ส่งออร์เดอร์เข้าคิว': '🚀 Send order to queue',
    '🛒 ดูตะกร้า': '🛒 View cart', '🧱 ผังแถวล็อคของตลาด': '🧱 Market lot rows',
    '🧾 ดูตะกร้า': '🧾 View cart', '🧾 ตะกร้าออเดอร์': '🧾 Order cart', '🧾 ตะกร้าออร์เดอร์': '🧾 Order cart',
    '🧾 รับออเดอร์': '🧾 Orders', '🧾 ออเดอร์ล่าสุด': '🧾 Recent orders', '🧾 รับออร์เดอร์': '🧾 Orders', '🧾 ออร์เดอร์ล่าสุด': '🧾 Recent orders',
    'ซื้อ 2 ตลาดขึ้นไป': '2+ markets', 'ดูประวัติ': 'View history',
    'บันทึกข้อมูลตลาด': 'Save market info', 'บันทึกข้อมูลร้าน': 'Save shop info',
    'บันทึกช่องทางติดต่อ': 'Save contact channels', 'บันทึกตารางเปิดทำการ': 'Save opening schedule',
    'บันทึกผังตลาด': 'Save lot layout',
    'ประเภทร้าน': 'Shop category', 'ประเภทสินค้า': 'Product category',
    'ปิด = สินค้าหมด ลูกค้าสั่งไม่ได้': 'Off = sold out, customers can’t order it',
    'ปิดชั่วคราวได้เมื่อของหมดหรือครัวไม่พร้อม': 'Temporarily close when sold out or the kitchen is busy',
    'ปิดชั่วคราวได้เมื่อร้านไม่พร้อม': 'Temporarily close when the shop isn’t ready',
    'ปิดทำการวันนี้': 'Closed today', 'จากทุกตลาด': 'from all markets',
    'ชื่อร้าน': 'Shop name', 'ว่าง — ยังไม่มีผู้เช่า': 'Vacant — no vendor yet',

    /* placeholder ตัวอย่าง */
    'เช่น somchai / 0891234567': 'e.g. somchai / 0891234567',
    'เช่น สมหญิง ใจดี': 'e.g. Somwang Jaidee',
    '08x-xxx-xxxx (ไม่บังคับ)': '08x-xxx-xxxx (optional)',
    'you@email.com (ไม่บังคับ)': 'you@email.com (optional)',
    'เช่น พี่บอล': 'e.g. Ball',
    'เช่น ตลาดนัดหมู่บ้านสวนสยาม': 'e.g. Suan Sayam Night Market',
    'เช่น นนทบุรี · ปากเกร็ด': 'e.g. Nonthaburi · Pak Kret',
    'เช่น เปิดเสาร์–อาทิตย์ 08:00 – 15:00': 'e.g. Sat–Sun 08:00 – 15:00',
    'เช่น ป้ายแดง / มุมปลาเผา': 'e.g. Auntie Daeng / fish-grill corner',
    'เช่น ข้าวมันไก่ป้าแดง': 'e.g. Auntie Daeng Chicken Rice',
    'เช่น ก๋วยเตี๋ยวเรือเจ๊แป๊วะ': 'e.g. Paepho Boat Noodles',
    'เช่น A7': 'e.g. A7', 'เช่น B4': 'e.g. B4',
    'เช่น ข้าวมันไก่สูตรโบราณ นึ่งไก่ทุก 2 ชม.': 'e.g. Traditional chicken rice, steamed fresh every 2 hrs',
    '📞 เบอร์โทร เช่น 081-234-5678': '📞 Phone, e.g. 081-234-5678',
    '💬 LINE ID เช่น @kaimunkai': '💬 LINE ID, e.g. @kaimunkai',
    '🟢 WhatsApp (ขึ้นต้น 66…) เช่น 66812345678': '🟢 WhatsApp (start with 66…), e.g. 66812345678',
    '📘 Facebook (ชื่อเพจ หรือ URL)': '📘 Facebook (page name or URL)',
    'เช่น กรุงเทพฯ · เขตบางบอน': 'e.g. Bangkok · Bang Bon',
    'เช่น เปิดทุกวัน 16:00 – 23:00': 'e.g. Open daily 16:00 – 23:00',
    'เช่น ก๋วยเตี๋ยวเรือส้มตำป้านิด': 'e.g. Auntie Nit Boat Noodles & Papaya Salad',
    'เช่น ก๋วยเตี๋ยว / เครื่องดื่ม': 'e.g. noodles / drinks',
    'เช่น ส้มตำแม่ประนอม': 'e.g. Maeprom Papaya Salad',
    'เช่น คุณสมชาย / โต๊ะ 5': 'e.g. Mr. Somchai / Table 5',
    'เช่น ไม่ใส่หัวหอม (ไม่บังคับ)': 'e.g. no onion (optional)',
    'เช่น 081-234-5678': 'e.g. 081-234-5678',
    'เช่น ไม่ใส่หัวหอม': 'e.g. no onion',
    'เช่น ก๋วยเตี๋ยวต้มยำกุ้ง': 'e.g. tom yum shrimp noodles',
    '@ร้านของคุณ': '@yourshop', 'ชื่อเพจ หรือ facebook.com/...': 'page name or facebook.com/…',
    'ร้าน@อีเมล.com': 'shop@email.com',
    'เช่น พี่บอล / คุณสมหญิง': 'e.g. Ball / Ms. Somwang',
    'เช่น ไม่ใส่หัวหอม หวานน้อย': 'e.g. no onion, less sweet',
    'เช่น สมชาย ใจดี': 'e.g. Somchai Jaidee', 'เช่น somchai': 'e.g. somchai',
    'TalatSuite — ชุดเครื่องมือจัดการตลาด': 'TalatSuite — Market management suite',
    'Facebook (เพจหรือลิงก์)': 'Facebook (page or link)',
    'กด "เพิ่มร้านค้าใหม่" เพื่อเปิดรับร้านเข้าตลาด': 'Tap “＋ Add new shop” to accept shops into the market',
    'ตามตาราง': 'Follow schedule', 'สถานะวันนี้: ตามตาราง': 'Today’s status: follow schedule',

    /* ข้อความ error จากเซิร์ฟเวอร์ (แสดงผ่าน toast) */
    'ไม่พบร้านนี้': 'Shop not found', 'ไม่พบตลาดนี้': 'Market not found', 'ไม่พบเมนูนี้': 'Menu item not found',
    'ไม่พบออเดอร์นี้': 'Order not found', 'ไม่พบบัญชีนี้': 'Account not found', 'ไม่พบผู้ใช้': 'User not found', 'ไม่พบออร์เดอร์นี้': 'Order not found',
    'ร้านนี้ปิดอยู่ในขณะนี้ ไม่รับออเดอร์': 'This shop is currently closed and not accepting orders', 'ร้านนี้ปิดอยู่ในขณะนี้ ไม่รับออร์เดอร์': 'This shop is currently closed and not accepting orders',
    'ร้านนี้ปิดอยู่ในขณะนี้ ไม่รับออร์เดอร์': 'This shop is currently closed and not accepting orders',
    'ตลาดนี้ปิดทำการวันนี้ ไม่รับออเดอร์': 'This market is closed today and not accepting orders', 'ตลาดนี้ปิดทำการวันนี้ ไม่รับออร์เดอร์': 'This market is closed today and not accepting orders',
    'ตลาดนี้ปิดทำการวันนี้ ไม่รับออร์เดอร์': 'This market is closed today and not accepting orders',
    'ไม่สามารถสั่งได้': 'Cannot place this order',
    'ยังไม่ได้เข้าสู่ระบบ': 'Not logged in', 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่': 'Login failed, please try again',
    'สมัครสมาชิกไม่สำเร็จ': 'Sign-up failed', 'บัญชีของคุณไม่สามารถส่งออเดอร์ได้': 'Your account cannot place orders', 'บัญชีของคุณไม่สามารถส่งออร์เดอร์ได้': 'Your account cannot place orders',
    'ชื่อผู้ใช้นี้ถูกใช้แล้ว': 'This username is already taken',
    'ชื่อผู้ใช้ต้องยาว 3 ตัวขึ้นไป (a-z, 0-9)': 'Username must be 3+ characters (a-z, 0-9)',
    'รหัสผ่านไม่ถูกต้อง': 'Incorrect password',
    'รหัสติดตามออเดอร์ไม่ถูกต้อง': 'Invalid order tracking code', 'รหัสติดตามออร์เดอร์ไม่ถูกต้อง': 'Invalid order tracking code',
    'รหัสติดตามออร์เดอร์ไม่ถูกต้อง': 'Invalid order tracking code',
    'กรุณาระบุร้าน': 'Please specify the shop', 'กรุณาระบุ market_id ของล็อค': 'Missing market_id for the lot',
    'ราคาต้องเป็นตัวเลข 0 ถึง 1,000,000': 'Price must be 0 – 1,000,000',
    'สต็อกต้องเป็นจำนวนเต็ม 0 ขึ้นไป': 'Stock must be a whole number ≥ 0',
    'รูปแบบวันที่ไม่ถูกต้อง': 'Invalid date format',
    'ลบบัญชีตัวเองไม่ได้': 'You can’t delete your own account',
    'ไม่สามารถลบแอดมินคนสุดท้ายของระบบได้': 'Cannot delete the last admin account',
    'ประเภทบัญชีต้องเป็น manager หรือ vendor': 'Account type must be manager or vendor',
    'ตลาดนี้มีผู้จัดการอยู่แล้ว': 'This market already has a manager',
    'ร้านนี้มีบัญชีร้านค้าอยู่แล้ว': 'This shop already has a vendor account',
    'เลือกตลาดที่ผู้จัดการนี้ดูแล': 'Choose the market this manager oversees',
    'เปิดร้านได้เฉพาะในตลาดที่คุณดูแล': 'Shops can only be opened in your own market',
    'รับออเดอร์ได้เฉพาะร้านของตัวเอง': 'Orders can only be taken for your own shop', 'รับออร์เดอร์ได้เฉพาะร้านของตัวเอง': 'Orders can only be taken for your own shop',
    'รับออร์เดอร์ได้เฉพาะร้านของตัวเอง': 'Orders can only be taken for your own shop',
    'ไม่มีสิทธิ์เข้าถึง': 'Access denied', 'ไม่มีสิทธิ์': 'Access denied',
    'ล็อคอินก่อนใช้งาน': 'Please log in first',
    'บัญชีถูกระงับ': 'Account suspended',
    'ชื่อห้ามว่าง': 'Name cannot be empty', 'ชื่อร้านห้ามว่าง': 'Shop name cannot be empty',
    'ชื่อตลาดห้ามว่าง': 'Market name cannot be empty', 'ชื่อเมนูห้ามว่าง': 'Item name cannot be empty',
    'สร้างตลาดไม่สำเร็จ กรุณาลองใหม่': 'Could not create the market, please retry',
    'บันทึกไม่สำเร็จ กรุณาลองใหม่': 'Save failed, please retry',
    'ลบไม่สำเร็จ กรุณาลองใหม่': 'Delete failed, please retry',
    'กรุณากรอกเบอร์โทรที่ถูกต้อง เช่น 0812345678 — เพื่อยืนยันว่าติดต่อคุณได้จริง': 'Please enter a valid phone number, e.g. 0812345678 — so the shop can actually reach you',
    'กรุณาเลือกอย่างน้อย 1 รายการอาหาร': 'Please select at least 1 item',

    /* v5 — แขก / แผนที่ / สต็อก / รายงาน */
    'สั่งโดยไม่สมัคร (ต้องมีเบอร์โทร)': 'Order without an account (phone required)',
    'สมัครสมาชิกเก็บประวัติออเดอร์ (ฟรี)': 'Create a free account to keep order history', 'สมัครสมาชิกเก็บประวัติออร์เดอร์ (ฟรี)': 'Create a free account to keep order history',
    'สมัครสมาชิกเก็บประวัติออร์เดอร์ (ฟรี)': 'Create a free account to keep order history',
    'สมัครตอนนี้': 'Sign up now', 'ไว้ก่อน': 'Maybe later',
    'เบอร์โทร (บังคับ — ยืนยันตัวตนกันออเดอร์ปลอม)': 'Phone (required — prevents fake orders)', 'เบอร์โทร (บังคับ — ยืนยันตัวตนกันออร์เดอร์ปลอม)': 'Phone (required — prevents fake orders)',
    'เบอร์โทร (บังคับ — ยืนยันตัวตนกันออร์เดอร์ปลอม)': 'Phone (required — prevents fake orders)',
    'ออเดอร์แขก': 'Guest order', 'ติดตามออเดอร์แขก': 'Track guest order', 'ออร์เดอร์แขก': 'Guest order', 'ติดตามออร์เดอร์แขก': 'Track guest order',
    'แขก (ไม่สมาชิก)': 'Guest (non-member)',
    'ลูกค้าสั่งแล้วไม่มาเก็บ — เบอร์โทรช่วยลดปัญหานี้': 'No-shows are a real problem — a phone number greatly reduces them',
    '📍 ใช้พิกัด GPS': '📍 Use GPS coordinates',
    'ดูเส้นทาง': 'Get directions', 'แผนที่': 'Map',
    'พิมพ์ / บันทึก PDF': 'Print / save as PDF',
    'รายงานรายรับ': 'Revenue report', 'รายงานยอดขาย': 'Sales report',
    'รายงานค่าเช่า': 'Rent report', 'รายงานบัญชีผู้ใช้': 'User accounts report',
    'รายงานข้อมูลลูกค้า': 'Customer data report', 'รายงานบันทึกกิจกรรม': 'Activity log report',
    'พิมพ์รายงานนี้': 'Print this report',
    'พิกัด GPS': 'GPS coordinates', 'ละติจูด': 'Latitude', 'ลองจิจูด': 'Longitude',
    'ใกล้เคียง': 'near', 'ห่าง': 'away',
    'ทั้งหมด': 'All', 'วันนี้': 'Today', 'เมื่อวาน': 'Yesterday',
    'รวม': 'Total', 'รวมทั้งสิ้น': 'Grand total', 'เฉลี่ย': 'Average',
    'ออเดอร์แขกวันนี้': 'Guest orders today', 'สัดส่วนแขก': 'Guest share', 'ออร์เดอร์แขกวันนี้': 'Guest orders today',
    'สินค้าหมดวันนี้': 'Sold out today', 'เหลือสต็อก': 'Stock left',
    'ตัดสต็อกอัตโนมัติเมื่อมีออเดอร์': 'Auto-decremented on each order', 'ตัดสต็อกอัตโนมัติเมื่อมีออร์เดอร์': 'Auto-decremented on each order',
    'ตัดสต็อกอัตโนมัติเมื่อมีออร์เดอร์': 'Auto-decremented on each order',
    'ตั้งจำนวนสต็อก (เว้นว่าง = ไม่จำกัด)': 'Set stock count (blank = unlimited)',

    /* หน้าส่งออก v5.4 */
    'ส่งออก / พิมพ์รายงาน': 'Export & print', 'เลือกรูปแบบที่ต้องการ': 'Choose a format',
    'CSV — เปิดใน Excel ได้ทันที': 'CSV — opens in Excel right away',
    'ไฟล์ตารางข้อมูล เปิดใน Excel / Google Sheets ได้เลย': 'Spreadsheet file for Excel / Google Sheets',
    'PDF — พิมพ์หรือบันทึกรายงาน': 'PDF — print or save a report',
    'รายงานจัดหน้าสวยงาม พร้อมพิมพ์กระดาษ / บันทึกเป็น PDF': 'Nicely formatted report — print on paper or save as PDF',
    'คัดลอกทั้งหมด (คลิปบอร์ด)': 'Copy all (clipboard)',
    'คัดลอกข้อมูลไปวางใน Excel / แชทได้เลย': 'Paste straight into Excel or a chat',
    'บันทึกไฟล์แล้ว': 'File saved', 'เปิดดูได้ในแอป "ไฟล์" → Downloads': 'Find it in the Files app → Downloads',
    'คัดลอกแล้ว — วางได้ทุกที่ (Excel/แชท)': 'Copied — paste anywhere (Excel/chats)',
    'คัดลอกไม่สำเร็จ': 'Copy failed',
    'กำลังเตรียม…': 'Preparing…',
    'อา': 'Sun', 'จ': 'Mon', 'อ': 'Tue', 'พ': 'Wed', 'พฤ': 'Thu', 'ศ': 'Fri', 'ส': 'Sat',
    'เปิดวันนี้ / ปิดวันนี้': 'Open today / Closed today',
    'เข้าชมตลาด & สั่งอาหาร': 'Browse markets & order food',
    'สั่งอาหาร': 'Order food',
    /* ═══ v5: ภาษา / บัญชี / แขก ═══ */
    '🌐 ภาษา / Language': '🌐 Language / ภาษา',
    'เปลี่ยนภาษาได้ทุกเมื่อ — ใช้ได้ทั้งไทยและอังกฤษ (EN)': 'Switch anytime — fully available in Thai and English (EN)',
    'เปลี่ยนเป็นภาษาไทยแล้ว': 'Switched to Thai',
    '🗑 ลบบัญชีของฉัน': '🗑 Delete my account',
    'ลบบัญชีถาวร': 'Delete account permanently',
    'ลบบัญชี': 'Delete account',
    'พร้อมประวัติออเดอร์และข้อมูลทั้งหมด': 'including all order history and data', 'พร้อมประวัติออร์เดอร์และข้อมูลทั้งหมด': 'including all order history and data',
    'พร้อมประวัติออร์เดอร์และข้อมูลทั้งหมด': 'including all order history and data',
    'ไม่สามารถเรียกคืนได้ — ยืนยันเพื่อลบถาวร': 'This cannot be undone — confirm to delete permanently',
    'ลบบัญชีเรียบร้อย — แล้วเจอกันใหม่ 👋': 'Account deleted — see you again 👋',
    'ลบบัญชีไม่สำเร็จ': 'Could not delete account',
    'แก้ไขบัญชี': 'Edit account',
    'ตั้ง/ลบรหัสล็อค': 'Set/remove lock code',
    '🚀 สั่งเป็นแขก': '🚀 Order as guest',
    '🚀 สั่งเป็นแขก (ไม่ต้องสมัคร)': '🚀 Order as guest (no sign-up)',
    'สั่งได้เลยไม่ต้องสมัคร — แต่ต้องกรอกชื่อและ': 'Order right away without signing up — but please give your name and',
    'เบอร์โทรจริง': 'a real phone number',
    'เพื่อให้ร้านติดต่อคุณได้เมื่ออาหารพร้อม': 'so the shop can contact you when your food is ready',
    'เบอร์โทร (จำเป็น)': 'Phone number (required)',
    '(จำเป็น — ร้านใช้ติดต่อเมื่ออาหารพร้อม)': '(required — the shop uses it to contact you when food is ready)',
    'กรุณากรอกชื่อของคุณ (อย่างน้อย 2 ตัวอักษร)': 'Please enter your name (at least 2 characters)',
    'กรุณากรอกเบอร์โทรที่ถูกต้อง เช่น 0812345678 — เพื่อให้ร้านติดต่อคุณได้': 'Please enter a valid phone number, e.g. 0812345678 — so the shop can reach you',
    'กรุณากรอกเบอร์โทรที่ถูกต้อง เช่น 0812345678 — เพื่อให้ร้านติดต่อคุณได้จริง': 'Please enter a valid phone number, e.g. 0812345678 — so we can really reach you',
    '🚀 ส่งออเดอร์ถึงร้าน': '🚀 Send order to shop', '🚀 ส่งออร์เดอร์ถึงร้าน': '🚀 Send order to shop',
    '🚀 ส่งออร์เดอร์ถึงร้าน': '🚀 Send order to shop',
    'ส่งออเดอร์ถึงร้าน (เป็นแขก)': 'Send order to shop (as guest)', 'ส่งออร์เดอร์ถึงร้าน (เป็นแขก)': 'Send order to shop (as guest)',
    'ส่งออร์เดอร์ถึงร้าน (เป็นแขก)': 'Send order to shop (as guest)',
    '(เป็นแขก)': '(as guest)',
    '· แขก': '· Guest', 'แขก': 'Guest',
    'สั่งเป็นแขกได้เลย (กรอกชื่อ + เบอร์โทร) — สถานะจะแสดงที่หน้านี้บนเครื่องนี้': 'You can order as a guest (name + phone) — status shows on this page on this device',
    'หรือเข้าสู่ระบบเพื่อเก็บประวัติออเดอร์ทุกร้านแบบถาวร': 'or sign in to keep your order history across all shops permanently', 'หรือเข้าสู่ระบบเพื่อเก็บประวัติออร์เดอร์ทุกร้านแบบถาวร': 'or sign in to keep your order history across all shops permanently',
    'หรือเข้าสู่ระบบเพื่อเก็บประวัติออร์เดอร์ทุกร้านแบบถาวร': 'or sign in to keep your order history across all shops permanently',
    '👤 โหมดแขก — แสดงออเดอร์ที่สั่งจากเครื่องนี้ (ไม่มีบัญชี) · ': '👤 Guest mode — orders placed on this device (no account) · ', '👤 โหมดแขก — แสดงออร์เดอร์ที่สั่งจากเครื่องนี้ (ไม่มีบัญชี) · ': '👤 Guest mode — orders placed on this device (no account) · ',
    '👤 โหมดแขก — แสดงออร์เดอร์ที่สั่งจากเครื่องนี้ (ไม่มีบัญชี) · ': '👤 Guest mode — orders placed on this device (no account) · ',
    'เข้าสู่ระบบเก็บประวัติถาวร': 'Sign in to keep history permanently',
    'อยากเก็บประวัติออเดอร์ไหม?': 'Want to keep your order history?', 'อยากเก็บประวัติออร์เดอร์ไหม?': 'Want to keep your order history?',
    'อยากเก็บประวัติออร์เดอร์ไหม?': 'Want to keep your order history?',
    'สมัครฟรีด้วยเบอร์เดิม — ประวัติ/สถานะ/แต้มถูกเก็บทุกร้าน': 'Free sign-up with this phone — history/status kept across all shops',
    '📝 สมัครสมาชิก (เบอร์นี้)': '📝 Sign up (this phone)',
    'ไว้คราวหน้า': 'Maybe later',
    'ตั้งรหัสผ่านอย่างน้อย 4 ตัว': 'Set a password of at least 4 characters',
    '🔒 สั่งเป็นแขกได้เลย': '🔒 Order as guest',
    'เพื่อเก็บประวัติออเดอร์ทุกร้านไว้ดูย้อนหลัง': 'to keep order history across all shops', 'เพื่อเก็บประวัติออร์เดอร์ทุกร้านไว้ดูย้อนหลัง': 'to keep order history across all shops',
    'เพื่อเก็บประวัติออร์เดอร์ทุกร้านไว้ดูย้อนหลัง': 'to keep order history across all shops',
    'ออเดอร์ของฉัน': 'My orders', 'ออร์เดอร์ของฉัน': 'My orders',
    'ออร์เดอร์ของฉัน': 'My orders',

    /* ═══ v5: แจ้งเตือน ═══ */
    '🔔 เปิดแจ้งเตือนแล้ว — จะแจ้งเมื่อออเดอร์พร้อม/เสร็จสิ้น': '🔔 Notifications on — we’ll alert you when orders are ready/completed', '🔔 เปิดแจ้งเตือนแล้ว — จะแจ้งเมื่อออร์เดอร์พร้อม/เสร็จสิ้น': '🔔 Notifications on — we’ll alert you when orders are ready/completed',
    '🔔 เปิดแจ้งเตือนแล้ว — จะแจ้งเมื่อออร์เดอร์พร้อม/เสร็จสิ้น': '🔔 Notifications on — we’ll alert you when orders are ready/completed',
    'ไม่ได้รับสิทธิ์แจ้งเตือน (ยังดูสถานะในแอปได้ตามปกติ)': 'Notification permission denied (you can still track status in the app)',
    'เปิดแจ้งเตือนออเดอร์': 'Enable order notifications', 'เปิดแจ้งเตือนออร์เดอร์': 'Enable order notifications',
    'เปิดแจ้งเตือนออร์เดอร์': 'Enable order notifications',
    'แจ้งเตือนออเดอร์เปิดอยู่': 'Order notifications are on', 'แจ้งเตือนออร์เดอร์เปิดอยู่': 'Order notifications are on',
    'แจ้งเตือนออร์เดอร์เปิดอยู่': 'Order notifications are on',
    'เปิดแจ้งเตือนเมื่ออาหารพร้อม': 'Enable notifications for when food is ready',
    'TalatSuite — อัปเดตออเดอร์': 'TalatSuite — order update', 'TalatSuite — อัปเดตออร์เดอร์': 'TalatSuite — order update',
    'TalatSuite — อัปเดตออร์เดอร์': 'TalatSuite — order update',
    'TalatSuite — ออเดอร์พร้อมแล้ว': 'TalatSuite — order ready', 'TalatSuite — ออร์เดอร์พร้อมแล้ว': 'TalatSuite — order ready',
    'TalatSuite — ออร์เดอร์พร้อมแล้ว': 'TalatSuite — order ready',
    'อัปเดตออเดอร์': 'order update', 'อัปเดตออร์เดอร์': 'order update',
    'อัปเดตออร์เดอร์': 'order update',

    /* ═══ v5: แผนที่ / ที่อยู่ ═══ */
    '📍 ที่อยู่และแผนที่': '📍 Address & map',
    '📍 ที่ตั้งตลาด': '📍 Market location',
    '🧭 เปิดแผนที่': '🧭 Open map',
    '🗺 เปิดแผนที่ · นำทาง': '🗺 Map · Directions',
    '🚗 นำทางถึงตลาด': '🚗 Directions to market',
    '🗺 แผนที่ตลาด': '🗺 Market map',
    'คัดลอก': 'Copy', 'คัดลอกแล้ว 📋': 'Copied 📋', 'คัดลอกไม่สำเร็จ': 'Copy failed',
    'รหัสติดตาม': 'Tracking code',
    'แตะเพื่อเปิดใน Google Maps': 'Tap to open in Google Maps',
    '● ใหม่': '● New', 'ออเดอร์ใหม่': 'New order', 'ออร์เดอร์ใหม่': 'New order',
    'ร้านเปิดตอนนี้': 'Shops open now', 'จากทุกร้านในตลาด': 'of all shops in market',
    'แผนที่': 'Map', 'เปิดแผนที่': 'Open map', 'นำทาง': 'Navigate',

    /* ═══ v5.2.1 — เติมช่องว่างที่สแกนพบ ═══ */
    /* aria-label / title / ป้ายช่วยพิเศษ */
    'เมนูนำทางหลัก': 'Main navigation', 'ภาษา / Language': 'Language',
    'รหัสล็อค': 'Screen-lock code', 'กลับหน้าหลัก': 'Home',
    'เปิดแจ้งเตือนออร์เดอร์': 'Turn on order notifications',
    'ล้างข้อมูลทั้งหมดในเครื่องนี้ แล้วกลับไปชุดข้อมูลตัวอย่างเริ่มต้น': 'Wipe all data on this device and restore the demo dataset',
    'ปิดแจ้งเตือนออร์เดอร์': 'Order notifications off',

    /* หัวเรื่อง/คำโปรยแอดมิน + ผจก. */
    'บัญชีผู้ใช้ทั้งหมด': 'All user accounts', 'ผู้จัดการ · ร้านค้า · ลูกค้า · แอดมิน': 'Managers · vendors · customers · admins',
    'ฐานข้อมูลลูกค้า': 'Customer database', 'พลังการตลาดของคุณ — สมาชิกจากทุกตลาดทุกร้าน': 'Your marketing power — members from every market & shop',
    'ทุกตลาดในมือเดียว': 'Every market in one place', 'ทุกการกระทำของผู้จัดการ ร้านค้า และลูกค้า — ตรวจสอบย้อนหลังได้': 'Every action by managers, vendors, and customers — fully traceable',
    'สร้างบัญชีร้านค้า': 'Create vendor account', 'สมาชิกจากทุกตลาด': 'from all markets',
    'ข้อมูลเพื่อการตลาด': 'data for marketing',

    /* ลูกค้า/ตลาด/ร้าน */
    'ประกาศจากตลาด:': 'Market announcement:', 'ตารางตลาด:': 'Market schedule:',
    'ดูตลาดที่เปิดวันนี้ แล้วเข้าไปสั่งอาหารจากร้านในตลาด': 'See markets open today, then order from shops inside',
    'โหมดแขก': 'Guest mode', 'แสดงออร์เดอร์ที่สั่งจากเครื่องนี้ (ไม่มีบัญชี)': 'showing orders placed on this device (no account)',
    'สั่งเป็นแขกได้เลย': 'Order as a guest right away',
    'กรอกชื่อ + เบอร์โทรจริงก็ส่งได้ทันที หรือ': 'enter your name + real phone number and send — or',
    'ส่งออเดอร์ถึงร้าน (เป็นแขก)': 'Send order to shop (as guest)', 'ส่งออร์เดอร์ถึงร้าน (เป็นแขก)': 'Send order to shop (as guest)',
    'ส่งออร์เดอร์ถึงร้าน (เป็นแขก)': 'Send order to shop (as guest)',
    'ส่งออเดอร์ถึงร้าน': 'Send order to shop', 'ส่งออร์เดอร์ถึงร้าน': 'Send order to shop',
    'ส่งออร์เดอร์ถึงร้าน': 'Send order to shop',
    'รหัสติดตาม': 'Tracking code', 'คัดลอก': 'Copy', 'คัดลอกแล้ว 📋': 'Copied 📋', 'คัดลอกไม่สำเร็จ': 'Copy failed',

    /* ร้านค้า */
    'รับออร์ดอร์': 'Take orders', '✓ บันทึกแล้ว': '✓ Saved',
    'รายการในตะกร้า': 'items in cart', 'เมนูที่สต็อกเหลือ 3 ชิ้นหรือน้อยกว่า': 'menu items at stock ≤ 3',
    'เหลือน้อย': 'low stock', 'รายการในเมนู': 'menu items',

    /* ผจก. */
    'มีผู้เช่า': 'occupied', 'รายการชำระ': 'payments',
    'จากผู้เช่า': 'of tenants', 'ล็อคในวันนี้': 'lots today',
    'แตะเพื่อเปลี่ยนวันที่': 'Tap to change date', 'แตะล็อคเพื่อแก้ไขข้อมูล': 'Tap a lot to edit its data',
    'ว่าง': 'Vacant', 'เปิดให้เช่า': 'Open for rent',

    /* สถานะเงิน */
    'ชำระแล้ว': 'Paid', 'ค้างชำระ': 'Unpaid',
    'สร้างออเดอร์': 'Create order', 'จัดการ': 'Manage', 'ขอบเขต': 'Scope', 'สร้างออร์เดอร์': 'Create order',
    'เบอร์/ผู้ใช้': 'Phone / login', 'บัญชี': 'Account', 'บัญชีผจก.': 'Manager account',
    'เปิด': 'Open', 'ปิด': 'Closed', 'ประวัติ': 'History',
    '🔁 สั่งอีกครั้ง': '🔁 Order again', 'แตะเพื่อโทรหาลูกค้า': 'Tap to call customer',
    'เมนูเปลี่ยนไปจากออเดอร์เดิม — เลือกใหม่ในหน้าร้านได้เลย': 'Menu changed since that order — pick fresh items in the shop page', 'เมนูเปลี่ยนไปจากออร์เดอร์เดิม — เลือกใหม่ในหน้าร้านได้เลย': 'Menu changed since that order — pick fresh items in the shop page',
    'เมนูเปลี่ยนไปจากออร์เดอร์เดิม — เลือกใหม่ในหน้าร้านได้เลย': 'Menu changed since that order — pick fresh items in the shop page',
    'ตรวจแล้วกดส่งได้เลย': 'check and send',
    'ที่อยู่ตลาด': 'Market address',
    'ละติจูด (lat)': 'Latitude (lat)',
    'ลองจิจูด (lng)': 'Longitude (lng)',
    '📡 ใช้พิกัดปัจจุบัน': '📡 Use current location',
    '🔎 ดูบนแผนที่': '🔎 View on map',
    'พรีวิวแผนที่': 'Map preview',
    '📢 ประกาศถึงลูกค้า': '📢 Announcement to customers',
    'บันทึกที่อยู่และแผนที่': 'Save address & map',
    'บันทึกที่อยู่และแผนที่แล้ว — ลูกค้าเห็นทันที': 'Saved address & map — customers see it instantly',
    'ลูกค้าเห็นที่อยู่ + แผนที่และปุ่มนำทางในหน้าตลาด — กรอกพิกัดเพื่อแสดงแผนที่ (ไม่กรอกก็ใช้ได้)': 'Customers see the address, map, and directions button on the market page — add coordinates to show a map (optional)',
    'ยังไม่ได้ใส่พิกัด — ': 'No coordinates yet — ',
    'ลูกค้าจะเห็นที่อยู่พร้อมปุ่มเปิดใน Google Maps': 'customers will see the address with an Open-in-Google-Maps button',
    'กรอกที่อยู่หรือพิกัดเพื่อให้ลูกค้าหาตลาดเจอง่าย ๆ': 'Enter an address or coordinates so customers can find the market easily',
    'กำลังขอตำแหน่งปัจจุบัน…': 'Getting current location…',
    'ได้พิกัดปัจจุบันแล้ว — ตรวจสอบแล้วกดบันทึก': 'Got your current coordinates — check and save',
    'เครื่องนี้ไม่รองรับการระบุตำแหน่ง': 'This device doesn’t support location',
    'ไม่สามารถระบุตำแหน่งได้ (ไม่อนุญาตหรือสัญญาณอ่อน) — ใส่พิกัดเองก็ได้': 'Couldn’t get location (denied or weak signal) — you can enter coordinates manually',
    'กรอกละติจูดและลองจิจูดให้ครบคู่กัน (หรือเว้นว่างทั้งสองช่อง)': 'Fill both latitude and longitude (or leave both blank)',
    'ละติจูดต้องเป็นตัวเลข -90 ถึง 90 เช่น 13.7052': 'Latitude must be a number -90 to 90, e.g. 13.7052',
    'ลองจิจูดต้องเป็นตัวเลข -180 ถึง 180 เช่น 100.4118': 'Longitude must be a number -180 to 180, e.g. 100.4118',
    'เช่น 13.7052': 'e.g. 13.7052', 'เช่น 100.4118': 'e.g. 100.4118',
    'เช่น 123 ถ.เพชรเกษม แขวงบางไผ่ เขตบางแค กรุงเทพฯ 10160': 'e.g. 123 Phetkasem Rd, Bang Khae, Bangkok 10160',
    'เช่น สัปดาห์นี้มีรถไฟตลาดนัดสุดสัปดาห์นี้!': 'e.g. Night market train fair this weekend!',

    /* ═══ v5: สต็อก ═══ */
    '📦 สต็อกคงเหลือ (ไม่จำกัด = เว้นว่าง)': '📦 Stock left (blank = unlimited)',
    'ไม่จำกัด': 'Unlimited',
    'หมดสต็อก': 'Out of stock',
    '💡 ถ้าตั้งสต็อกไว้ ระบบจะตัดยอดอัตโนมัติเมื่อมีออเดอร์ และปิดขายเองเมื่อหมด': '💡 If stock is set, the system deducts it automatically with each order and stops selling at 0', '💡 ถ้าตั้งสต็อกไว้ ระบบจะตัดยอดอัตโนมัติเมื่อมีออร์เดอร์ และปิดขายเองเมื่อหมด': '💡 If stock is set, the system deducts it automatically with each order and stops selling at 0',
    '💡 ถ้าตั้งสต็อกไว้ ระบบจะตัดยอดอัตโนมัติเมื่อมีออร์เดอร์ และปิดขายเองเมื่อหมด': '💡 If stock is set, the system deducts it automatically with each order and stops selling at 0',
    'สต็อกต้องเป็นจำนวนเต็ม 0 ขึ้นไป (เว้นว่าง = ไม่จำกัด)': 'Stock must be a whole number ≥ 0 (blank = unlimited)',

    /* ═══ v5: บันทึกกิจกรรม + ส่งออก ═══ */
    'บันทึกกิจกรรม': 'Activity log',
    'ทุกการกระทำในระบบ ตรวจสอบได้': 'Every action in the system, traceable',
    'ทุกการกระทำของผู้จัดการ ร้านค้า และลูกค้า — ตรวจสอบย้อนหลังได้': 'Every action by managers, vendors, and customers — fully traceable',
    '🔎 กรองบันทึก': '🔎 Filter entries',
    '↻ รีเฟรช': '↻ Refresh',
    '⬇️ CSV': '⬇️ CSV',
    '🖨 พิมพ์': '🖨 Print',
    'ทุกตลาด': 'All markets', 'ทุกบทบาท': 'All roles',
    'กรองตามตลาด': 'Filter by market', 'กรองตามบทบาท': 'Filter by role',
    'ค้นหา ชื่อ/รายละเอียด/ออเดอร์…': 'Search names/details/orders…', 'ค้นหา ชื่อ/รายละเอียด/ออร์เดอร์…': 'Search names/details/orders…',
    'ค้นหา ชื่อ/รายละเอียด/ออร์เดอร์…': 'Search names/details/orders…',
    'ไม่พบบันทึกที่ตรงเงื่อนไข': 'No matching entries',
    'ลองเปลี่ยนตัวกรอง หรือกดรีเฟรช': 'Try changing filters or refresh',
    'เวลา': 'Time', 'วันเวลา': 'Date & time', 'ผู้กระทำ': 'Actor', 'การกระทำ': 'Action',
    'รายละเอียด': 'Details', 'เป้าหมาย': 'Target', 'ตลาด': 'Market', 'บทบาท': 'Role',
    'โหลดบันทึกกิจกรรมไม่สำเร็จ': 'Could not load activity log',
    'ยังไม่มีบันทึกให้ส่งออก — กดรีเฟรชก่อน': 'No entries to export yet — refresh first',
    'ยังไม่มีบันทึกให้พิมพ์ — กดรีเฟรชก่อน': 'No entries to print yet — refresh first',
    'ตัวกรอง: ': 'Filters: ',
    'รายการล่าสุด': 'latest entries',
    'เข้าสู่ระบบ': 'Sign in', 'เข้าสู่ระบบเก็บประวัติถาวร': 'Sign in to keep history permanently',
    'เปิด': 'Open', 'ติดต่อ': 'Contact', 'ช่องทาง': 'Channel',
    'ลบตลาด': 'Delete market', 'สร้างร้าน': 'Create shop', 'ลบออเดอร์': 'Delete order', 'ลบออร์เดอร์': 'Delete order',
    'แก้ไขตลาด': 'Edit market', 'แก้ไขล็อค': 'Edit lot', 'แก้ไขร้าน': 'Edit shop',
    'แก้ไขเมนู': 'Edit menu', 'แก้ผังตลาด': 'Edit layout',
    'บันทึกค่าเช่า': 'Record rent', 'สร้างออเดอร์': 'Create order', 'สร้างออร์เดอร์': 'Create order',
    'เปลี่ยนสถานะออเดอร์': 'Change order status', 'รับออร์ดอร์': 'Take orders', 'เปลี่ยนสถานะออร์เดอร์': 'Change order status',
    'ออเดอร์': 'Order', 'ร้าน/ผู้เช่า': 'Shop/Tenant', 'ออร์เดอร์': 'Order',
    'ยอด (บาท)': 'Amount (THB)', 'จำนวนเงิน (บาท)': 'Amount (THB)',
    '— ลองอีกครั้ง': '— try again',
    'กรุณาเข้าสู่ระบบด้วยบัญชี': 'Please sign in with an account',
    'กำลังเตรียมไฟล์…': 'Preparing file…',
    'ยังไม่มีออเดอร์ให้ส่งออก': 'No orders to export yet', 'ยังไม่มีออร์เดอร์ให้ส่งออก': 'No orders to export yet',
    'ยังไม่มีออร์เดอร์ให้ส่งออก': 'No orders to export yet',
    'ยังไม่มีออเดอร์ให้พิมพ์': 'No orders to print yet', 'ยังไม่มีออร์เดอร์ให้พิมพ์': 'No orders to print yet',
    'ยังไม่มีออร์เดอร์ให้พิมพ์': 'No orders to print yet',
    'ยังไม่มีรายการชำระเงินในช่วงนี้': 'No payments in this period yet',
    'ยังไม่มีข้อมูลลูกค้าให้พิมพ์': 'No customer data to print yet',
    '⬇️ ส่งออกค่าเช่า (CSV)': '⬇️ Export rent (CSV)',
    '🖨 พิมพ์รายงานตลาด': '🖨 Print market report',
    '⬇️ ส่งออกยอดขาย (CSV)': '⬇️ Export sales (CSV)',
    '🖨 พิมพ์รายงานยอดขาย': '🖨 Print sales report',
    '🖨 พิมพ์รายงาน': '🖨 Print report',
    'ออกรายงานเมื่อ': 'Report generated on',
    '· ล็อค': '· Lot', 'ชิ้น': 'pcs',
    'ทั้งหมด': 'All', 'รวม': 'Total', 'รวมทั้งหมด': 'Grand total',
    'วันที่': 'Date', 'เวลา': 'Time', 'ชื่อ': 'Name', 'เบอร์โทร': 'Phone', 'อีเมล': 'Email',
    'สถานะ': 'Status', 'รายการ': 'Items', 'ลูกค้า': 'Customer', 'ราคา': 'Price',
    'เข้าใช้ล่าสุด': 'Last active', 'ยอดใช้จ่าย': 'Total spend', 'ออเดอร์': 'Orders', 'ออร์เดอร์': 'Orders',
    'ล็อค': 'Lot', 'ร้าน': 'Shop', 'ตลาดที่ซื้อ': 'Markets shopped',
    'สมาชิก': 'Member', 'คน': 'people', 'แถว': 'Row(s)', 'แถวทั้งหมด': 'All rows',
    'รายงานตลาด': 'Market report', 'ยอดขาย': 'Sales', 'ฐานข้อมูลลูกค้า': 'Customer database',
    'รายงานยอดขาย': 'Sales report', 'ช่อง': 'slots',
    '· (แสดง 200 รายการล่าสุดในรายงาน)': '· (latest 200 shown in report)',
    'ว่าง': 'Vacant', 'สร้างออเดอร์': 'Create order', 'สร้างออร์เดอร์': 'Create order',
    'เปิดรับผู้เช่า': 'Open for rent',

    'ลูกค้าแขก': 'Guest customer', 'ไม่มาขาย': 'Absent today', 'มีผู้เช่า': 'occupied',
    'ค่าเช่า (บาท)': 'Rent (THB)', 'หมวด': 'Category', 'สถานะชำระ': 'Payment status',
    'ยอดรวมทั้งหมด': 'Grand total', 'ล็อคที่มีผู้เช่า': 'occupied lots',
    'ช่อง จาก': 'slots of', 'ช่องจาก': 'slots of',
    /* หมวดร้าน */
    'อาหารและเครื่องดื่ม': 'Food & drinks', 'เสื้อผ้าและแฟชั่น': 'Clothing & fashion',
    'ของสด/ผักผลไม้': 'Fresh produce', 'ของใช้ทั่วไป': 'General goods',
    /* ช่องทางชำระ */
    'เงินสด': 'Cash', 'พร้อมเพย์': 'PromptPay',
    /* เดือน/วัน (แบบสั้น) */
    'อา.': 'Sun', 'จ.': 'Mon', 'อ.': 'Tue', 'พ.': 'Wed', 'พฤ.': 'Thu', 'ศ.': 'Fri', 'ส.': 'Sat',
    'อาทิตย์': 'Sunday', 'จันทร์': 'Monday', 'อังคาร': 'Tuesday', 'พุธ': 'Wednesday',
    'พฤหัสบดี': 'Thursday', 'ศุกร์': 'Friday', 'เสาร์': 'Saturday',
    'ม.ค.': 'Jan', 'ก.พ.': 'Feb', 'มี.ค.': 'Mar', 'เม.ย.': 'Apr', 'พ.ค.': 'May', 'มิ.ย.': 'Jun',
    'ก.ค.': 'Jul', 'ส.ค.': 'Aug', 'ก.ย.': 'Sep', 'ต.ค.': 'Oct', 'พ.ย.': 'Nov', 'ธ.ค.': 'Dec',
  };

  /* ---------- พจนานุกรม: รูปแบบมีตัวแปร (regex → คำแปล) ---------- */
  /* $1..$n = capture group / ฟังก์ชัน (m) => คำแปล */
  const PATTERNS = [
    /* v6: การ์ดตลาด (หน้าสมัครร้าน) */
    [/^🏪 (\d+) ร้านในตลาด(?: · (\d+) ล็อค)?$/, (m) => `🏪 ${m[1]} shops in this market${m[2] ? ` · ${m[2]} lots` : ''}`],

    /* เวลา / วันที่ */
    [/^(\d{1,3}) (นาที|ชม\.|วัน)\s*ที่แล้ว$/, (m) => (m[2] === 'นาที' ? `${m[1]} min ago` : m[2] === 'ชม.' ? `${m[1]} hr ago` : `${m[1]} days ago`)],
    [/^(\d{1,2}):(\d{2}) น\.$/, '$1'],
    [/^เปิดทุกวัน (\d{1,2}:\d{2}) ?– ?(\d{1,2}:\d{2})$/, 'Open daily $1–$2'],
    [/^เปิดศุกร์–อาทิตย์ (\d{1,2}:\d{2}) ?– ?(\d{1,2}:\d{2})$/, 'Open Fri–Sun $1–$2'],
    [/^(\d{1,2}) (ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.) (\d{4})$/, (m) => `${EXACT[m[2]]} ${m[1]}, ${Number(m[3]) - 543}`],
    [/^(อา\.|จ\.|อ\.|พ\.|พฤ\.|ศ\.|ส\.) (\d{1,2}) (ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.) (\d{4})$/, (m) => `${EXACT[m[1]]} ${EXACT[m[3]]} ${m[2]}, ${Number(m[4]) - 543}`],
    [/^วัน(อาทิตย์|จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์)ที่ (\d{1,2}) (.+) พ\.ศ\. (\d{4})$/, (m) => `${EXACT[m[1]]}, ${EXACT[m[3]] || m[3]} ${m[2]}, ${Number(m[4]) - 543}`],
    [/^(\d{1,2}) (มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม) (\d{4})$/, (m) => `${EXACT[m[2]]} ${m[1]}, ${Number(m[3]) - 543}`],
    [/^(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม) (\d{4})$/, (m) => `${EXACT[m[1]]} ${Number(m[2]) - 543}`],

    /* ตารางเปิดทำการ */
    [/^เปิดทุกวัน (.+) น\.$/, 'Open daily $1'],
    [/^🔁 เติม (\d+) รายการเดิมลงตะกร้าแล้ว( \((\d+) รายการถูกถอดจากเมนูแล้ว\))? — ตรวจแล้วกดส่งได้เลย$/, (m) => `🔁 Re-added ${m[1]} items to your cart${m[3] ? ` (${m[3]} items were removed from the menu)` : ''} — check and send`],
    /* นับจำนวน (v5.2.1) */
    [/^(\d+) ออเดอร์$/, '$1 orders'],
    [/^(\d+) ออร์เดอร์$/, '$1 orders'],
    [/^(\d+) ร้าน$/, '$1 shops'],
    [/^(\d+) ตลาด$/, '$1 markets'],
    [/^เก็บจาก (\d+) ตลาด$/, 'across $1 markets'],
    [/^\((\d+) เปิด\)$/, '($1 open)'],
    [/^(\d+) รายการในเมนู$/, '$1 menu items'],
    [/^เมนู (\d+) รายการ$/, '$1 menu items'],
    [/^(\d+) รายการในตะกร้า$/, '$1 items in cart'],
    [/^(\d+) รายการชำระ$/, '$1 payments'],
    [/^มีผู้เช่า (\d+) ล็อค$/, '$1 lots occupied'],
    [/^จากผู้เช่า (\d+) ล็อคในวันนี้$/, 'of $1 occupied lots today'],
    [/^(\d+\/\d+) มีผู้เช่า$/, '$1 occupied'],
    [/^มี (\d+) ออเดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ$/, '$1 orders in progress — this page updates status automatically'],
    [/^มี (\d+) ออร์เดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ$/, '$1 orders in progress — this page updates status automatically'],
    [/^มี (\d+) เมนูที่สต็อกเหลือ 3 ชิ้นหรือน้อยกว่า$/, '$1 menu items at stock ≤ 3'],
    [/^แถว ([A-Z]) \(([A-Z]\d+–[A-Z]\d+)\)$/, 'Row $1 ($2)'],
    [/^เปิดแผนที่ (.+)$/, (m) => 'Open map: ' + translate(m[1])],
    [/^อัปเดต (\d{1,2}:\d{2}) น\.$/, 'updated $1'],
    [/^(.+), (\d+) มีผู้เช่า$/, '$1, $2 occupied'],
    [/^สั่งเมื่อ (.+)$/, 'Ordered $1'],
    [/^ยินดีต้อนรับ (.+) 🎉$/, 'Welcome, $1 🎉'],
    [/^ออกจากระบบแล้ว — ลาก่อน (.+) 👋$/, 'Logged out — bye $1 👋'],
    [/^ตลาดนี้ปิดทำการวันนี้$/, 'This market is closed today'],
    [/^ปิดทำการวันนี้$/, 'Closed today'],
    [/^(\d+) ล็อค$/, '$1 lots'],
    [/^(\d+) ร้าน$/, '$1 shops'],
    [/^(\d+) รายการ$/, '$1 items'],
    [/^(\d+\/\d+) ร้านเปิด$/, '$1 shops open'],
    [/^วันนี้ (\d+) ออเดอร์ (.+)$/, 'today: $1 orders · $2'],
    [/^วันนี้ (\d+) ออร์เดอร์ (.+)$/, 'today: $1 orders · $2'],
    [/^ทั้งหมด (\d+)$/, 'All $1'],
    [/^กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ$/, 'in progress — this page updates status automatically'],
    [/^ออร์เดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ$/, 'orders in progress — this page updates automatically'],
    [/^ออเดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ$/, 'orders in progress — this page updates automatically'],
    [/^ออร์เดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ$/, 'orders in progress — this page updates automatically'],
    [/^เปิด (.+) น\.$/, (m) => 'Open ' + translate(m[1])],
    [/^เปิดทุกวัน$/, 'Open daily'],


    /* ทักทาย / แจ้งเตือนออเดอร์ */
    [/^ยินดีต้อนรับ (.+) 🎉$/, 'Welcome, $1 🎉'],
    [/^ยินดีต้อนรับ (.+)! ข้อมูลจะเติมให้อัตโนมัติ$/, 'Welcome, $1! Your details were filled in'],
    [/^ออกจากระบบแล้ว — ลาก่อน (.+) 👋$/, 'Logged out — bye $1 👋'],
    [/^🎉 ส่งออเดอร์ #(\d+) ถึงร้านแล้ว \(ยอด (.+)\) — ติดตามสถานะได้เลย$/, '🎉 Order #$1 sent (total $2) — track its status now'],
    [/^🎉 ส่งออร์เดอร์ #(\d+) ถึงร้านแล้ว \(ยอด (.+)\) — ติดตามสถานะได้เลย$/, '🎉 Order #$1 sent (total $2) — track its status now'],
    [/^🔔 ออเดอร์ #(\d+) \((.+)\): (.+)$/, '🔔 Order #$1 ($2): $3'],
    [/^🔔 ออร์เดอร์ #(\d+) \((.+)\): (.+)$/, '🔔 Order #$1 ($2): $3'],
    [/^✅ ออเดอร์ #(\d+) เสร็จสิ้นแล้ว — ขอบคุณค่ะ$/, '✅ Order #$1 completed — thank you!'],
    [/^✅ ออร์เดอร์ #(\d+) เสร็จสิ้นแล้ว — ขอบคุณค่ะ$/, '✅ Order #$1 completed — thank you!'],

    /* ชื่อล็อค / ราคา / สรุป */
    [/^ค่าเช่าต่อล็อคแถว (.+)$/, 'Rent per lot in row $1'],
    [/^ราคา (.+)$/, (m) => 'Price of ' + translate(m[1])],
    [/^สถานะการขาย (.+)$/, (m) => 'Sales status of ' + translate(m[1])],
    [/^แก้ไข (.+)$/, (m) => 'Edit ' + translate(m[1])],
    [/^ลบเมนู (.+)$/, (m) => 'Delete ' + translate(m[1])],
    [/^บันทึกการแก้ไข "(.+)" แล้ว$/, 'Saved changes to “$1”'],
    [/^บันทึกการแก้ไขออเดอร์ #(\d+) เรียบร้อย$/, 'Order #$1 updated'],
    [/^บันทึกการแก้ไขออร์เดอร์ #(\d+) เรียบร้อย$/, 'Order #$1 updated'],
    [/^ล็อค (.+)$/, 'Lot $1'],
    [/^(\d+) รายการ$/, '$1 items'],
    [/^เปิด (.+)\/(.+) ร้าน$/, '$1/$2 shops open'],

    /* v5: สต็อก / แผนที่ / ส่งออก / แขก */
    [/^เหลือ (\d+)$/, '$1 left'],
    [/^เหลือ (\d+) ชิ้น$/, '$1 left'],
    [/^แผนที่ (.+)$/, 'Map: $1'],
    [/^พิกัด (.+)$/, 'Coordinates: $1'],
    [/^ส่งออกไม่สำเร็จ \((.+)\)$/, 'Export failed ($1)'],
    [/^ยินดีต้อนรับสมาชิกใหม่ (.+)! 🎉$/, 'Welcome, new member $1! 🎉'],
    [/^ส่งออกบันทึก (\d+) รายการเป็น CSV แล้ว$/, 'Exported $1 entries as CSV'],
    [/^ส่งออก (\d+) ออเดอร์ \(ยอดรวม (.+)\) เป็น CSV แล้ว$/, 'Exported $1 orders (total $2) as CSV'],
    [/^ส่งออก (\d+) ออร์เดอร์ \(ยอดรวม (.+)\) เป็น CSV แล้ว$/, 'Exported $1 orders (total $2) as CSV'],
    [/^ส่งออก (\d+) รายการ \((.+)\) เป็น CSV แล้ว$/, 'Exported $1 entries ($2) as CSV'],
    [/^ตั้งรหัสผ่าน 4 ตัวขึ้นไป — เบอร์ (.+) พร้อมใช้แล้ว$/, 'Set a password of 4+ characters — phone $1 is ready'],
    [/^ออเดอร์ #(\d+) จาก (.+) เสร็จสิ้นแล้ว — ขอบคุณที่ใช้บริการ$/, 'Order #$1 from $2 completed — thank you'],
    [/^ออร์เดอร์ #(\d+) จาก (.+) เสร็จสิ้นแล้ว — ขอบคุณที่ใช้บริการ$/, 'Order #$1 from $2 completed — thank you'],
    [/^ออเดอร์ #(\d+) จาก (.+) → (.+)$/, 'Order #$1 from $2 → $3'],
    [/^ออร์เดอร์ #(\d+) จาก (.+) → (.+)$/, 'Order #$1 from $2 → $3'],
    [/^ลบออเดอร์ #(\d+)$/, 'Delete order #$1'],
    [/^ลบออร์เดอร์ #(\d+)$/, 'Delete order #$1'],
    [/^ออเดอร์ #(\d+) → (.+)$/, 'Order #$1 → $2'],
    [/^ออร์เดอร์ #(\d+) → (.+)$/, 'Order #$1 → $2'],

    /* บันทึกกิจกรรม: action codes */
    [/^market\.create$/, 'market.create'], [/^market\.update$/, 'market.update'],
    [/^market\.delete$/, 'market.delete'], [/^market\.layout$/, 'market.layout'],
    [/^lot\.update$/, 'lot.update'], [/^lot\.payment$/, 'lot.payment'],
    [/^shop\.create$/, 'shop.create'], [/^shop\.update$/, 'shop.update'], [/^shop\.delete$/, 'shop.delete'],
    [/^menu\.create$/, 'menu.create'], [/^menu\.update$/, 'menu.update'], [/^menu\.delete$/, 'menu.delete'],
    [/^order\.create$/, 'order.create'], [/^order\.status$/, 'order.status'], [/^order\.delete$/, 'order.delete'],
    [/^user\.create$/, 'user.create'], [/^user\.update$/, 'user.update'], [/^user\.delete$/, 'user.delete'],
    [/^auth\.login$/, 'auth.login'], [/^auth\.register$/, 'auth.register'],
    [/^auth\.password$/, 'auth.password'], [/^auth\.passcode$/, 'auth.passcode'],
     /* ตารางเปิดทำการ: "เปิด อา–ศ 17:00–24:00 น." / "เปิด อา–ศ" (คู่วันแปลแยกใน rep) */
    [/^เปิด (.+) (\d{1,2}:\d{2})–(\d{1,2}:\d{2}) น\.$/, (m) => `Open ${translate(m[1])} ${m[2]}–${m[3]}`],
    [/^เปิด (.+)$/, (m) => 'Open ' + translate(m[1])],
  ];

  /* โทเคนย่อย — แปลแบบแทนที่ในประโยค (วัน ศ–อา, ป้ายสถานะ ฯลฯ) */
  const TOKENS = {
    /* วัน/เวลา */
    'ศุกร์–อาทิตย์': 'Fri–Sun', 'ศ–อา': 'Fri–Sun',
    'จันทร์–ศุกร์': 'Mon–Fri', 'จ–ศ': 'Mon–Fri',
    /* คู่วันย่อ (ตารางเปิดทำการ) + เปิดวันเดี่ยว */
    'อา–จ': 'Sun–Mon',
    'อา–อ': 'Sun–Tue',
    'อา–ศ': 'Sun–Fri',
    'จ–อ': 'Mon–Tue',
    'จ–พ': 'Mon–Wed',
    'จ–พฤ': 'Mon–Thu',
    'อ–อา': 'Tue–Sun',
    'อ–จ': 'Tue–Mon',
    'อ–พ': 'Tue–Wed',
    'อ–พฤ': 'Tue–Thu',
    'อ–ศ': 'Tue–Fri',
    'อ–ส': 'Tue–Sat',
    'พ–อา': 'Wed–Sun',
    'พ–จ': 'Wed–Mon',
    'พ–อ': 'Wed–Tue',
    'พ–พฤ': 'Wed–Thu',
    'พ–ศ': 'Wed–Fri',
    'พ–ส': 'Wed–Sat',
    'พฤ–อา': 'Thu–Sun',
    'พฤ–จ': 'Thu–Mon',
    'พฤ–อ': 'Thu–Tue',
    'พฤ–พ': 'Thu–Wed',
    'พฤ–ศ': 'Thu–Fri',
    'พฤ–ส': 'Thu–Sat',
    'ศ–จ': 'Fri–Mon',
    'ศ–อ': 'Fri–Tue',
    'ศ–พ': 'Fri–Wed',
    'ศ–พฤ': 'Fri–Thu',
    'ศ–ส': 'Fri–Sat',
    'ส–อา': 'Sat–Sun',
    'ส–จ': 'Sat–Mon',
    'ส–อ': 'Sat–Tue',
    'ส–พ': 'Sat–Wed',
    'ส–พฤ': 'Sat–Thu',
    'ส–ศ': 'Sat–Fri',
    'เปิดวันอา': 'Open Sun',
    'เปิดวันจ': 'Open Mon',
    'เปิดวันอ': 'Open Tue',
    'เปิดวันพ': 'Open Wed',
    'เปิดวันพฤ': 'Open Thu',
    'เปิดวันศ': 'Open Fri',
    'เปิดวันส': 'Open Sat',
    'อา–พฤ': 'Sun–Thu', 'จ–ส': 'Mon–Sat', 'อา–ส': 'Sun–Sat',
    'อา–พ': 'Sun–Wed', 'จ–อา': 'Mon–Sun',
    'เปิดวันนี้': 'Open today', 'ปิดวันนี้': 'Closed today',
    'ตลาดปิดวันนี้': 'market closed today',
    'เมื่อสักครู่': 'just now', 'ที่แล้ว': 'ago',
    'ชั่วโมงที่แล้ว': 'hours ago', 'นาทีที่แล้ว': 'minutes ago',
    'น.': '',

    /* คำสามัญในประโยคปะปน (ยาว→สั้น กันซ้อนคำ) */
    'ร้านค้า/แม่ค้า': 'vendor', 'ผู้จัดการตลาด': 'market manager',
    'ร้านค้า': 'vendor shop', 'ผู้จัดการ': 'managers', 'แอดมินระบบ': 'system admin',
    'ลูกค้า': 'customers', 'พิซซ่าอิฐร้อน': "Bee's Brick Oven",
    'ออร์เดอร์': 'order', 'ออร์เดอร์ใหม่': 'new order', 'ผจก.': 'Mkt mgr',
    'สเต็กเตาถ่าน': "Boss's Charcoal Steak", 'ชาไทย': 'Thai Tea',
    'ล็อค': 'Lot', 'ออกจากระบบ': 'Log out', 'สั่งเมื่อ': 'Ordered',
    'วันนี้': 'today', 'ยอด': 'total', 'เปิด': 'open',
    'เปิดรับออเดอร์': 'accepting orders', 'ปิดรับออเดอร์': 'not accepting orders', 'เปิดรับออร์เดอร์': 'accepting orders', 'ปิดรับออร์เดอร์': 'not accepting orders',
    'ออเดอร์': 'order', 'ตลาด': 'market', 'ร้าน': 'shop', 'เมนู': 'menu', 'ออร์เดอร์': 'order',
    'บัญชีร้านค้า': 'vendor account', 'แขก': 'Guest', 'สมาชิก': 'member',
    'เข้าสู่ระบบ': 'Log in', 'บาท': 'baht', 'ตั้งค่า': 'Settings',

    /* ชื่อตลาด (ข้อมูลตัวอย่าง) */
    'ตลาดนัดริมคลองบางบอน': 'Bang Bon Canal Night Market',
    'ไนท์มาร์เก็ตสวนลุม': 'Suan Lum Night Market',
    'กรุงเทพฯ · เขตบางบอน': 'Bangkok · Bang Bon',
    'กรุงเทพฯ · ปทุมวัน': 'Bangkok · Pathum Wan',
    '123 ถ.เพชรเกษม แขวงบางไผ่ เขตบางแค กรุงเทพฯ 10160': '123 Phetkasem Rd, Bang Khae, Bangkok 10160',
    '188 ถ.วิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330': '188 Wireless Rd, Lumphini, Pathum Wan, Bangkok 10330',
    'ตลาดสด + ตลาดนัดย้อนหลังริมคลอง มีทั้งของกิน ของใช้ และผักผลไม้สดจากสวน': 'Fresh market + retro night market by the canal — food, goods, and farm-fresh produce',
    'ตลาดกลางคืนสไตล์สวนสาธารณะ อาหารร้านเด็ด คาเฟ่ และของฝาก': 'Park-style night market — famous eateries, cafés, and gifts',
    'สัปดาห์นี้มีรถไฟตลาดนัดทุกคืนศุกร์–อาทิตย์': 'Night train market every night this week (Fri–Sun)',

    /* ชื่อร้าน (ข้อมูลตัวอย่าง) */
    'พิซซ่าอิฐร้อน บี': "Bee's Brick-Oven Pizza",
    'ชาไทยเจ๊แอ๊ด': "Aunt Aed's Thai Tea",
    'สเต็กเตาถ่านพี่บอส': "Boss's Charcoal Steak",
    'ข้าวมันไก่ป้าแดง': "Aunt Daeng's Chicken Rice",
    'ผักสดสวนคุณนิ่ม': "Khun Nim's Fresh Veg",
    'เสื้อยืด Thai Land': 'Thai Land Tees',
    'ผลไม้ริมทางเจ๊หนู': "Noo's Roadside Fruits",
    'ก๋วยเตี๋ยวเรือลุงหนู': "Uncle Noo's Boat Noodles",
    'ร้านของชำจันทร์เพ็ญ': 'Junpen Grocery',
    'ปลาเผาเจ๊ปิ่ง': "Aunt Ping's Grilled Fish",
    'พิซซ่าอิฐเผา ชีสเยิ้ม โดว์หมัก 48 ชม. ของสดทำวันต่อวัน': 'Wood-fired pizza, melty cheese, 48-hr dough — made fresh daily',
    'ชาไทยเข้มข้นหอมใบเตย ชงสดทุกแก้ว รับออเดอร์ล่วงหน้าได้': 'Rich pandan Thai tea brewed fresh — pre-orders welcome', 'ชาไทยเข้มข้นหอมใบเตย ชงสดทุกแก้ว รับออร์เดอร์ล่วงหน้าได้': 'Rich pandan Thai tea brewed fresh — pre-orders welcome',
    'ชาไทยเข้มข้นหอมใบเตย ชงสดทุกแก้ว รับออร์เดอร์ล่วงหน้าได้': 'Rich pandan Thai tea brewed fresh — pre-orders welcome',
    'สเต็กเนื้อชิ้นหนา ย่างเตาถ่าน ซอสสูตรลับของพี่บอส': "Thick-cut charcoal-grilled steak with Boss's secret sauce",

    /* เมนู (ข้อมูลตัวอย่าง) */
    'พิซซ่าฮาวายเอี้ยน': 'Hawaiian Pizza',
    'พิซซ่าซีฟู้ดต้มยำ': 'Tom Yum Seafood Pizza',
    'พิซซ่ามาการีตา': 'Margherita Pizza',
    'มันฝรั่งทอดกรอบ': 'Crispy French Fries',
    'ชาไทยเข้มข้น': 'Rich Thai Tea',
    'ชาเขียวนมสด': 'Fresh-Milk Green Tea',
    'ชามะลิเย็น': 'Iced Jasmine Tea',
    'น้ำส้มคั้น': 'Fresh Orange Juice',

    /* หมวดสินค้า */
    'อาหาร/เครื่องดื่ม': 'Food & Drinks',
    'เสื้อผ้า': 'Apparel',
    'ของสด': 'Fresh Produce',
    'ทั่วไป': 'General',
    'เงินสด': 'Cash', 'สแกน PromptPay': 'PromptPay',

    /* สถานะออเดอร์/อีเวนต์ */
    'รอดำเนินการ': 'Pending', 'กำลังอบ/กำลังทำ': 'Preparing',
    'พร้อมรับ/ส่ง': 'Ready', 'เสร็จสิ้น': 'Completed',
    'ร้านรับออเดอร์เข้าคิวแล้ว': 'Shop accepted the order', 'ร้านรับออร์เดอร์เข้าคิวแล้ว': 'Shop accepted the order',
    'ร้านรับออร์เดอร์เข้าคิวแล้ว': 'Shop accepted the order',
    'กำลังเตรียมอาหาร': 'Preparing your food',
    'อาหารพร้อมรับ/รอส่งแล้ว': 'Food is ready for pickup/delivery',
    'ขอบคุณที่ใช้บริการ': 'Thanks for your order',
    'ลูกค้าแขกส่งออเดอร์ผ่านแอป': 'Guest customer sent the order via app', 'ลูกค้าแขกส่งออร์เดอร์ผ่านแอป': 'Guest customer sent the order via app',
    'ลูกค้าแขกส่งออร์เดอร์ผ่านแอป': 'Guest customer sent the order via app',
    'ลูกค้าส่งออเดอร์ผ่านแอป': 'Customer sent the order via app', 'ลูกค้าส่งออร์เดอร์ผ่านแอป': 'Customer sent the order via app',
    'ลูกค้าส่งออร์เดอร์ผ่านแอป': 'Customer sent the order via app',
    'รับออเดอร์หน้าร้าน': 'Walk-in order taken at the counter', 'รับออร์เดอร์หน้าร้าน': 'Walk-in order taken at the counter',
    'รับออร์เดอร์หน้าร้าน': 'Walk-in order taken at the counter',
  };

  const TH_RE = /[\u0E00-\u0E7F]/;

  /* โทเคนเรียงยาว→สั้น กันการแทนคำสั้นซ้อนในคำยาว */
  const TOKEN_LIST = Object.entries(TOKENS).sort((a, b) => b[0].length - a[0].length);
  const SEP_RE = /(\s·\s|\s—\s)/;
  const LEAD_RE = /^([^A-Za-z0-9\u0E00-\u0E7F]*)([\s\S]*)$/;

  function translate(s) {
    if (typeof s !== 'string' || lang !== 'en' || !TH_RE.test(s)) return s;
    const out = tryTranslate(s);
    if (out !== null) return out;
    /* โทเคน (คำ/วลีฝังในประโยค) แล้วลอง exact/pattern อีกรอบ */
    let t = s;
    for (const [k, v] of TOKEN_LIST) {
      if (t.includes(k)) t = t.split(k).join(v);
    }
    if (t !== s) {
      const out2 = tryTranslate(t);
      if (out2 !== null) return out2;
      if (!TH_RE.test(t)) return t;
    }
    /* ประโยคคั่นหลายท่อน ("ก · ข — ค") → แปลทีละท่อนแล้วต่อกลับ */
    if (SEP_RE.test(s)) {
      return s.split(SEP_RE).map((seg) => (SEP_RE.test(seg) ? seg : translate(seg))).join('');
    }
    return t !== s ? t : s;
  }

  /* exact → pattern โดยดูทั้งข้อความเดิม และข้อความที่ตัด emoji/เครื่องหมายนำหน้าออก ("🛡️ ภาพรวมระบบ" → "ภาพรวมระบบ") */
  function tryTranslate(s) {
    const key = s.trim();
    if (!key) return null;
    if (EXACT[key]) return s.replace(key, EXACT[key]);
    for (const [re, rep] of PATTERNS) {
      const m = key.match(re);
      if (m) {
        const res = typeof rep === 'function' ? rep(m) : key.replace(re, rep);
        return s.replace(key, res);
      }
    }
    const lm = key.match(LEAD_RE);
    if (lm && lm[1].trim()) {
      const k2 = lm[2].trim();
      if (k2 && k2 !== key) {
        if (EXACT[k2]) return s.replace(key, lm[1].trim() + ' ' + EXACT[k2]);
        for (const [re, rep] of PATTERNS) {
          const m = k2.match(re);
          if (m) {
            const res = typeof rep === 'function' ? rep(m) : k2.replace(re, rep);
            return s.replace(key, lm[1].trim() + ' ' + res);
          }
        }
      }
    }
    return null;
  }

  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  /* เก็บข้อความต้นฉบับ (ไทย) ก่อนแปล เพื่อคืนค่าเมื่อสลับกลับเป็นไทย
     — แก้ปัญหา modal ที่เปิดค้างอยู่ไม่ถูก re-render แล้วค้างเป็นอังกฤษ */
  const origText = new WeakMap();
  const origAttr = new WeakMap();
  const keepText = (n) => { if (!origText.has(n)) origText.set(n, n.nodeValue); };
  const keepAttr = (el, a, v) => {
    let o = origAttr.get(el);
    if (!o) { o = {}; origAttr.set(el, o); }
    if (!(a in o)) o[a] = v;
  };
  function revertNode(root) {
    if (!root) return;
    const walk = (node) => {
      if (node.nodeType === 3) {
        const o = origText.get(node);
        if (o != null && o !== node.nodeValue) node.nodeValue = o;
        return;
      }
      if (node.nodeType !== 1 || node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
      const o = origAttr.get(node);
      if (o) for (const a in o) { try { if (node.getAttribute(a) != null) node.setAttribute(a, o[a]); } catch (e) {} }
      for (let c = node.firstChild; c; c = c.nextSibling) walk(c);
    };
    walk(root.nodeType ? root : document.body);
  }
  function translateNode(root) {
    if (lang !== 'en' || !root) return;
    if (root.nodeType === 3) {
      const v = translate(root.nodeValue);
      if (v !== root.nodeValue) root.nodeValue = v;
      return;
    }
    if (root.nodeType !== 1) return;
    if (root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    for (const a of ATTRS) {
      const v = root.getAttribute && root.getAttribute(a);
      if (v && TH_RE.test(v)) {
        const t = translate(v);
        if (t !== v) { keepAttr(root, a, v); root.setAttribute(a, t); }
      }
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !TH_RE.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const v = translate(n.nodeValue);
      if (v !== n.nodeValue) { keepText(n); n.nodeValue = v; }
    }
    root.querySelectorAll && root.querySelectorAll('*').forEach((el) => {
      for (const a of ATTRS) {
        const v = el.getAttribute && el.getAttribute(a);
        if (v && TH_RE.test(v)) {
          const t = translate(v);
          if (t !== v) { keepAttr(el, a, v); el.setAttribute(a, t); }
        }
      }
    });
  }

  /* สังเกตการเปลี่ยนแปลง DOM → แปลใหม่อัตโนมัติ (เฉพาะโหมด EN) */
  let mo = null;
  function startObserver() {
    if (mo || !document.body) return;
    mo = new MutationObserver((muts) => {
      if (lang !== 'en') return;
      for (const mu of muts) {
        if (mu.type === 'characterData' && mu.target.nodeValue) {
          const v = translate(mu.target.nodeValue);
          if (v !== mu.target.nodeValue) { keepText(mu.target); mu.target.nodeValue = v; }
        } else if (mu.type === 'attributes' && mu.target.nodeType === 1) {
          const v = mu.target.getAttribute(mu.attributeName);
          if (v) {
            const t = translate(v);
            if (t !== v) { keepAttr(mu.target, mu.attributeName, v); mu.target.setAttribute(mu.attributeName, t); }
          }
        }
        for (const n of mu.addedNodes) translateNode(n);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  let lang = readLang();

  function apply(langTo) {
    if (lang === 'en' && langTo !== 'en' && document.body) {
      try { revertNode(document.body); } catch (e) { /* ปล่อยผ่าน */ }
    }
    lang = langTo;
    writeLang(langTo);
  }

  window.TS = {
    get lang() { return lang; },
    get supported() { return SUPPORTED.slice(); },
    label(l) { return LANG_LABEL[l] || l; },
    translate,
    translateNode,
    revertNode,
    setLang(l) {
      if (!SUPPORTED.includes(l) || l === lang) return;
      apply(l);
      /* แอปหลักลงทะเบียน hook ไว้ — เรียกเพื่อ re-render ทั้งหน้า แล้วค่อยแปลซ้ำ */
      if (typeof window.__tsRerender === 'function') {
        try { window.__tsRerender(); } catch (e) { /* ปล่อยผ่าน */ }
      }
      translateNode(document.body);
      document.documentElement.setAttribute('lang', l);
    },
    init() {
      document.documentElement.setAttribute('lang', lang);
      startObserver();
      if (lang === 'en') translateNode(document.body);
    },
  };
})();

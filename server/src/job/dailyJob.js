// const cron = require('node-cron');

// function myDailyTask() {
//   // Gọi API nội bộ, hoặc thực hiện logic bạn muốn mỗi 24h
//   console.log('Chạy job mỗi 24h:', new Date());
//   // Ví dụ: gọi service, gửi mail, cập nhật dữ liệu, ...
// }

// function startDailyJob() {
//   // Chạy vào 0h mỗi ngày
//   //cron.schedule('0 0 * * *', myDailyTask, { timezone: 'Asia/Ho_Chi_Minh' });
//   // Nếu muốn test mỗi 10 giây:
//   cron.schedule('*/10 * * * * *', myDailyTask); // mỗi 10 giây
// }

// module.exports = { startDailyJob };

const cron = require('node-cron');
// Import service


const dailyJobService = require('../api/v1/services/dailyJob.service');
const notificationService = require('../api/v1/services/nofiticationForContract.service');
const { getDb } = require('../im/bootstrap');

async function myDailyTask() {
  console.log('Chạy daily job:', new Date());
  try {
    // 1. Cập nhật hợp đồng hết hạn
    console.log('- Đang cập nhật hợp đồng hết hạn...');
    const expiredResult = await dailyJobService.updateExpiredContracts();
    console.log('- Kết quả cập nhật hợp đồng hết hạn:', expiredResult);

    // 2. Cập nhật trạng thái khách sạn dựa trên hợp đồng
    console.log('- Đang cập nhật trạng thái khách sạn...');
    const hotelResult = await dailyJobService.updateHotelStatusByContract();
    console.log('- Kết quả cập nhật trạng thái khách sạn:', hotelResult);


    // 3. Tìm hợp đồng sắp hết hạn và gửi thông báo
    const expiringConfigs = [
      { days: 90, contracts: await dailyJobService.findContractsExpiringIn90Days() },
      { days: 60, contracts: await dailyJobService.findContractsExpiringIn60Days() },
      { days: 30, contracts: await dailyJobService.findContractsExpiringIn30Days() },
      { days: 3, contracts: await dailyJobService.findContractsExpiringIn3Days() },
      { days: 1, contracts: await dailyJobService.findContractsExpiringIn1Day() },
    ];

    // Lấy thông tin khách sạn cho message
    const db = getDb();

    for (const { days, contracts } of expiringConfigs) {
      console.log(`- Hợp đồng hết hạn trong ${days} ngày: ${contracts.length}`);
      for (const contract of contracts) {
        // Lấy tên khách sạn
        let hotelName = '';
        if (contract.hotel_id) {
          const hotel = await db.collection('hotels').findOne({ hotel_id: contract.hotel_id });
          hotelName = hotel?.name || '';
        }
        // Gửi thông báo cho user
        await notificationService.addNotification({
          contract_id: contract.contract_id,
          hotel_id: contract.hotel_id,
          sender_id: 'system',
          receiver_id: contract.user_id,
          title: 'Thông báo hết hạn hợp đồng',
          message: `Hợp đồng của khách sạn ${hotelName} sẽ hết hạn trong ${days} ngày, vui lòng liên hệ để gia hạn!`,
          notification_type: 'Expired Contract',
          is_read: false,
          created_at: new Date()
        });
      }
    }

    // 4. Tìm hợp đồng pending quá 7 ngày và gửi thông báo trước khi chuyển trạng thái
    const pendingContracts = await dailyJobService.getPendingContractsOverDays(7);
    for (const contract of pendingContracts) {
      await notificationService.addNotification({
        contract_id: contract.contract_id,
        hotel_id: contract.hotel_id,
        sender_id: 'system',
        receiver_id: contract.user_id,
        title: 'Thông báo hết hạn duyệt hợp đồng',
        message: `Trạng Thái Duyệt đã chờ quá lâu vui lòng liên hệ lại với admin`,
        notification_type: 'Change Status Contract',
        is_read: false,
        created_at: new Date()
      });
    }

    // 5. Cập nhật hợp đồng pending thành draft sau 7 ngày
    console.log('- Đang cập nhật hợp đồng pending thành draft (7 ngày)...');
    const pendingToDraftResult = await dailyJobService.updatePendingContractsToDraft(7);
    console.log('- Kết quả cập nhật hợp đồng pending thành draft:', pendingToDraftResult);

    console.log('✅ Daily job hoàn thành thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi chạy daily job:', err);
  }
}

function startDailyJob() {
  //cron.schedule('0 7 * * *', myDailyTask, { timezone: 'Asia/Ho_Chi_Minh' });
  cron.schedule('*/10 * * * * *', myDailyTask); // mỗi 10 giây để test
}

module.exports = { startDailyJob };
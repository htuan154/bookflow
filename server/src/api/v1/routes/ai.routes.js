'use strict';

const express = require('express');
const router = express.Router();
const H = require('../controllers/history.controller');
const { validate } = require('../middlewares/validate.middleware');
const { AiSuggestSchema } = require('../../../validators/ai.validator');
const C = require('../controllers/ai.controller');
const { authenticateOptional } = require('../middlewares/auth.middleware'); // Middleware không bắt buộc login

/* 
  Router này nên được mount như:
  app.use('/api/v1/ai', require('./src/api/v1/routes/ai.routes'));
*/

/* #swagger.summary = 'Chatbot suggest'
   #swagger.tags = ['AI']
   #swagger.requestBody = {
     required: true,
     content: {
       "application/json": {
         schema: { $ref: "#/components/schemas/AiSuggest" },
         examples: { basic: { value: { "message": "Top 5 khách sạn Đà Nẵng" } } }
       }
     }
   }
*/
router.post('/suggest', authenticateOptional, validate(AiSuggestSchema), C.suggestHandler);

router.get('/history/sessions', authenticateOptional, H.listSessionsHandler);
router.get('/history/messages', authenticateOptional, H.listMessagesHandler);
// SQL (Supabase RPC) – test trực tiếp
router.get('/hotels/top', C.topHotelsHandler);
router.post('/hotels/by-amenities', C.hotelsByAmenitiesHandler);
router.get('/promotions/by-month', C.promotionsByMonthHandler);
router.get('/promotions/by-month-city', C.promotionsByMonthCityHandler);
router.get('/promotions/by-city', C.promotionsByCityHandler);

// Hotels
router.get('/hotels/search', C.searchHotelsHandler);
router.post('/hotels/by-any-amenities', C.hotelsByAnyAmenitiesHandler);
router.get('/hotels/full/:id', C.hotelFullHandler);

// Promotions – today / today-by-city / keyword+month+city / check / stats
router.get('/promotions/today', C.promotionsTodayHandler);
router.get('/promotions/today-by-city', C.promotionsTodayByCityHandler);
router.get('/promotions/search', C.promotionsByKeywordCityMonthHandler);
router.get('/promotions/check', C.promoCheckHandler);
router.get('/promotions/stats/:promotion_id', C.promoStatsHandler);

// Cities
router.get('/hotel-cities', C.hotelCitiesHandler);


module.exports = router;

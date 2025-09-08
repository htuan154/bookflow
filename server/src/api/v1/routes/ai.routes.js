'use strict';

const express = require('express');
const router = express.Router();

const { validate } = require('../middlewares/validate.middleware');
const { AiSuggestSchema } = require('../../../validators/ai.validator');
const { suggestHandler } = require('../controllers/ai.controller');

/* #swagger.summary = 'Chatbot suggest'
   #swagger.tags = ['AI']
   #swagger.requestBody = {
     required: true,
     content: {
       "application/json": {
         schema: { $ref: "#/components/schemas/AiSuggest" },
         examples: { basic: { value: { "message": "Da Nang an gi" } } }
       }
     }
   }
*/
router.post('/suggest', validate(AiSuggestSchema), suggestHandler);

module.exports = router;

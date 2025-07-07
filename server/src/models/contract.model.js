class Contract {
  constructor({
    contract_id, user_id, hotel_id, contract_number, contract_type, title,
    description, start_date, end_date, signed_date, contract_value,
    currency, payment_terms, status, contract_file_url,
    terms_and_conditions, notes, created_by, approved_by, created_at
  }) {
    this.contractId = contract_id;
    this.userId = user_id;
    this.hotelId = hotel_id;
    this.contractNumber = contract_number;
    this.contractType = contract_type;
    this.title = title;
    this.description = description;
    this.startDate = start_date;
    this.endDate = end_date;
    this.signedDate = signed_date;
    this.contractValue = contract_value;
    this.currency = currency;
    this.paymentTerms = payment_terms;
    this.status = status;
    this.contractFileUrl = contract_file_url;
    this.termsAndConditions = terms_and_conditions;
    this.notes = notes;
    this.createdBy = created_by;
    this.approvedBy = approved_by;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      contractId: this.contractId,
      userId: this.userId,
      hotelId: this.hotelId,
      contractNumber: this.contractNumber,
      title: this.title,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
    };
  }
}

module.exports = Contract;
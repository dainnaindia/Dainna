-- CreateTable
CREATE TABLE "user_type_master" (
    "user_type_id" SERIAL NOT NULL,
    "user_type" VARCHAR(50),

    CONSTRAINT "user_type_master_pkey" PRIMARY KEY ("user_type_id")
);

-- CreateTable
CREATE TABLE "user_master" (
    "user_id" SERIAL NOT NULL,
    "user_type_id" INTEGER,
    "user_code" INTEGER,
    "user_code_full" VARCHAR(255),
    "firstname" VARCHAR(255),
    "middlename" VARCHAR(255),
    "surname" VARCHAR(255),
    "firmname" VARCHAR(255),
    "username" VARCHAR(255),
    "mobile" VARCHAR(50),
    "email" VARCHAR(50),
    "password" VARCHAR(255),
    "address" VARCHAR(255),
    "district" VARCHAR(255),
    "city" VARCHAR(50),
    "state_id" INTEGER,
    "postcode" VARCHAR(8),
    "working_city" VARCHAR(255),
    "office_phone" VARCHAR(20),
    "aadhar_no" VARCHAR(20),
    "sq_id" INTEGER,
    "security_ans" VARCHAR(255),
    "status" INTEGER DEFAULT 0,
    "photo" VARCHAR(255),
    "bank_name" VARCHAR(255),
    "bank_branch" VARCHAR(255),
    "bank_ifsc_code" VARCHAR(255),
    "bank_ac_holder" VARCHAR(255),
    "bank_ac_no" VARCHAR(255),
    "token" VARCHAR(255),
    "token_expires" TIMESTAMP(3),
    "wrong_pwd_count" INTEGER DEFAULT 0,
    "email_verified" INTEGER DEFAULT 0,
    "email_verified_on" TIMESTAMP(3),
    "mobile_verified" INTEGER DEFAULT 0,
    "mobile_verified_on" TIMESTAMP(3),
    "rate_per_sqmt" DOUBLE PRECISION,
    "secure_pin" VARCHAR(255),
    "terms_accept" INTEGER DEFAULT 0,
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),
    "modifiedby" INTEGER,
    "modifieddate" TIMESTAMP(3),

    CONSTRAINT "user_master_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "chat_master" (
    "chat_id" SERIAL NOT NULL,
    "system_email_sms" INTEGER DEFAULT 1,
    "type" INTEGER DEFAULT 0,
    "support_type" INTEGER,
    "from_id" INTEGER,
    "to_id" INTEGER,
    "message" VARCHAR(500),
    "status" INTEGER DEFAULT 0,
    "sendtime" TIMESTAMP(3),
    "receivetime" TIMESTAMP(3),
    "seentime" TIMESTAMP(3),

    CONSTRAINT "chat_master_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "notification_master" (
    "notification_id" SERIAL NOT NULL,
    "from_id" INTEGER,
    "to_id" INTEGER,
    "olb_id" INTEGER,
    "adv_pay_id" INTEGER,
    "action" VARCHAR(255),
    "title" VARCHAR(255),
    "message" TEXT,
    "status" INTEGER DEFAULT 0,
    "sendtime" TIMESTAMP(3),
    "receivetime" TIMESTAMP(3),
    "seentime" TIMESTAMP(3),

    CONSTRAINT "notification_master_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "olb_master" (
    "olb_id" SERIAL NOT NULL,
    "type" INTEGER,
    "customize_readymade" INTEGER,
    "state_id" INTEGER,
    "area" INTEGER DEFAULT 1,
    "plot_area" VARCHAR(255),
    "city_survey_office" VARCHAR(255),
    "ward" VARCHAR(255),
    "sheet_no" VARCHAR(255),
    "district" VARCHAR(255),
    "taluka" VARCHAR(255),
    "village" VARCHAR(255),
    "khata_no" VARCHAR(255),
    "city_survey_no" VARCHAR(255),
    "tp_scheme_no" VARCHAR(255),
    "final_plot_no" VARCHAR(255),
    "sector_no" VARCHAR(255),
    "sector_plot_no" VARCHAR(255),
    "area_sq_mt" VARCHAR(255),
    "owner_first_name" VARCHAR(255),
    "owner_middle_name" VARCHAR(255),
    "owner_last_name" VARCHAR(255),
    "owner_mobile_no" VARCHAR(255),
    "purchaser_first_name" VARCHAR(255),
    "purchaser_middle_name" VARCHAR(255),
    "purchaser_last_name" VARCHAR(255),
    "purchaser_mobile_no" VARCHAR(255),
    "purchaser_email" VARCHAR(255),
    "building_name" VARCHAR(255),
    "flat_shop_no" VARCHAR(255),
    "floor_no" VARCHAR(255),
    "language" VARCHAR(255),
    "agreement_draft" TEXT,
    "draft_status" INTEGER,
    "agreement_addeddate" TIMESTAMP(3),
    "property_detail" TEXT,
    "prepared_date" TIMESTAMP(3),
    "sent_date" TIMESTAMP(3),
    "accept_date" TIMESTAMP(3),
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),
    "modifiedby" INTEGER,
    "modifieddate" TIMESTAMP(3),

    CONSTRAINT "olb_master_pkey" PRIMARY KEY ("olb_id")
);

-- CreateTable
CREATE TABLE "project_master" (
    "project_id" SERIAL NOT NULL,
    "project_name" VARCHAR(255),
    "state_id" INTEGER,
    "city" VARCHAR(255),
    "advocate_id" INTEGER,
    "email" VARCHAR(700),
    "reg_link_sent_on" TIMESTAMP(3),
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),
    "modifiedby" INTEGER,
    "modifieddate" TIMESTAMP(3),

    CONSTRAINT "project_master_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "adv_payment_history_master" (
    "adv_pay_history_id" SERIAL NOT NULL,
    "adv_pay_id" INTEGER NOT NULL,
    "transaction_id" VARCHAR(255),
    "transaction_date" DATE,
    "payment_method" VARCHAR(255),
    "remarks" VARCHAR(500),
    "amount" DECIMAL(10,2),
    "payment_status" INTEGER,
    "payment_remarks" VARCHAR(500),
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),

    CONSTRAINT "adv_payment_history_master_pkey" PRIMARY KEY ("adv_pay_history_id")
);

-- CreateTable
CREATE TABLE "adv_payment_master" (
    "adv_pay_id" SERIAL NOT NULL,
    "transaction_id" VARCHAR(255),
    "transaction_date" DATE,
    "payment_method" VARCHAR(255),
    "remarks" VARCHAR(500),
    "amount" DECIMAL(10,2),
    "payment_status" INTEGER,
    "payment_remarks" VARCHAR(500),
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),

    CONSTRAINT "adv_payment_master_pkey" PRIMARY KEY ("adv_pay_id")
);

-- CreateTable
CREATE TABLE "company_master" (
    "company_id" SERIAL NOT NULL,
    "company_name" VARCHAR(255),
    "company_alias" VARCHAR(255),
    "company_code" VARCHAR(255),
    "address" TEXT,
    "phone" VARCHAR(255),
    "mobile" VARCHAR(255),
    "email" VARCHAR(255),
    "gstin" VARCHAR(255),
    "pan_no" VARCHAR(255),
    "state" VARCHAR(50),
    "state_code" VARCHAR(50),
    "city" VARCHAR(255),
    "country" VARCHAR(255),
    "zip_code" VARCHAR(255),
    "bank_name" VARCHAR(255),
    "bank_ac_no" VARCHAR(255),
    "bank_ifsc" VARCHAR(255),
    "bank_swift_code" VARCHAR(255),
    "bank_branch" VARCHAR(255),
    "active" INTEGER DEFAULT 0,
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),
    "modifiedby" INTEGER,
    "modifieddate" TIMESTAMP(3),

    CONSTRAINT "company_master_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "handling_charges" (
    "charge_id" SERIAL NOT NULL,
    "state_id" INTEGER,
    "city" VARCHAR(255),
    "project_id" INTEGER,
    "charge_in_perc" DOUBLE PRECISION,
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),
    "modifiedby" INTEGER,
    "modifieddate" TIMESTAMP(3),

    CONSTRAINT "handling_charges_pkey" PRIMARY KEY ("charge_id")
);

-- CreateTable
CREATE TABLE "invoice_master" (
    "invoice_id" SERIAL NOT NULL,
    "olb_id" INTEGER,
    "project_id" INTEGER,
    "advocate_id" INTEGER,
    "customer_id" VARCHAR(255),
    "state_id" INTEGER,
    "inv_no" VARCHAR(255),
    "invoice_no" VARCHAR(255),
    "invoice_date" DATE,
    "size_width" DECIMAL(10,0) DEFAULT 0,
    "size_height" DECIMAL(10,0) DEFAULT 0,
    "size" DECIMAL(10,0) DEFAULT 0,
    "rate" DOUBLE PRECISION,
    "final_rate" DOUBLE PRECISION,
    "total" DOUBLE PRECISION,
    "sgst_rate" DECIMAL(10,2) DEFAULT 0.00,
    "sgst_amount" DECIMAL(10,2) DEFAULT 0.00,
    "cgst_rate" DECIMAL(10,2) DEFAULT 0.00,
    "cgst_amount" DECIMAL(10,2) DEFAULT 0.00,
    "igst_rate" DECIMAL(10,2) DEFAULT 0.00,
    "igst_amount" DECIMAL(10,2) DEFAULT 0.00,
    "handling_charge_rate" DECIMAL(10,2) DEFAULT 0.00,
    "handling_charge_amount" DECIMAL(10,2) DEFAULT 0.00,
    "grandtotal" DECIMAL(10,2) DEFAULT 0.00,
    "adv_amount" DECIMAL(10,2) DEFAULT 0.00,
    "razorpay_order_id" VARCHAR(255),
    "razorpay_response" TEXT,
    "payment_status" INTEGER,
    "payment_remarks" VARCHAR(255),
    "transaction_ref_no" VARCHAR(255),
    "transaction_remarks" VARCHAR(500),
    "pg_id" INTEGER,
    "adv_transaction_id" VARCHAR(255),
    "adv_payment_date" DATE,
    "adv_payment_method" VARCHAR(255),
    "adv_payment_remarks" VARCHAR(500),
    "adv_payment_status" INTEGER DEFAULT 0,
    "adv_ps_remarks" VARCHAR(255),
    "adv_pay_id" INTEGER,
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),
    "agent_payment_received_by" INTEGER,
    "agent_payment_received_date" TIMESTAMP(3),
    "adv_payment_received_by" INTEGER,
    "adv_payment_received_date" TIMESTAMP(3),

    CONSTRAINT "invoice_master_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "invoice_payment_master" (
    "ip_id" SERIAL NOT NULL,
    "invoice_id" INTEGER,
    "olb_id" INTEGER,
    "project_id" INTEGER,
    "advocate_id" INTEGER,
    "payment_status" VARCHAR(255),
    "razorpay_order_id" VARCHAR(255),
    "razorpay_payment_id" VARCHAR(255),
    "payment_method" VARCHAR(255),
    "bank_name" VARCHAR(255),
    "merchant_order_id" VARCHAR(255),
    "transaction_id" VARCHAR(255),
    "entity" VARCHAR(255),
    "razorpay_invoice_id" VARCHAR(255),
    "international" INTEGER,
    "amount_refunded" DECIMAL(10,0) DEFAULT 0,
    "refund_status" VARCHAR(255),
    "captured" INTEGER,
    "description" VARCHAR(255),
    "card_id" VARCHAR(255),
    "wallet" VARCHAR(255),
    "vpa" VARCHAR(255),
    "fee" DECIMAL(10,0) DEFAULT 0,
    "tax" DECIMAL(10,0) DEFAULT 0,
    "error_code" VARCHAR(255),
    "error_description" VARCHAR(255),
    "error_source" VARCHAR(255),
    "error_step" VARCHAR(255),
    "error_reason" VARCHAR(255),
    "razorpay_response" TEXT,
    "created_at" VARCHAR(255),
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),
    "modifiedby" INTEGER,
    "modifieddate" TIMESTAMP(3),

    CONSTRAINT "invoice_payment_master_pkey" PRIMARY KEY ("ip_id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "login_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "login_type" INTEGER,
    "ip" VARCHAR(50),
    "session_id" VARCHAR(255),
    "firebase_id" VARCHAR(255),
    "login_time" TIMESTAMP(3),
    "logout_time" TIMESTAMP(3),

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("login_id")
);

-- CreateTable
CREATE TABLE "olb_item_master" (
    "olb_item_id" SERIAL NOT NULL,
    "olb_id" INTEGER,
    "survey_no_new" VARCHAR(255),
    "survey_no_old" VARCHAR(255),

    CONSTRAINT "olb_item_master_pkey" PRIMARY KEY ("olb_item_id")
);

-- CreateTable
CREATE TABLE "payment_gateway_master" (
    "pg_id" SERIAL NOT NULL,
    "payment_gateway" VARCHAR(255),

    CONSTRAINT "payment_gateway_master_pkey" PRIMARY KEY ("pg_id")
);

-- CreateTable
CREATE TABLE "security_que_master" (
    "sq_id" SERIAL NOT NULL,
    "label" VARCHAR(255),
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),
    "modifiedby" INTEGER,
    "modifieddate" TIMESTAMP(3),

    CONSTRAINT "security_que_master_pkey" PRIMARY KEY ("sq_id")
);

-- CreateTable
CREATE TABLE "state_master" (
    "state_id" SERIAL NOT NULL,
    "state_code" VARCHAR(50),
    "state_name" VARCHAR(100),
    "addedby" INTEGER,
    "addeddate" TIMESTAMP(3),
    "modifiedby" INTEGER,
    "modifieddate" TIMESTAMP(3),

    CONSTRAINT "state_master_pkey" PRIMARY KEY ("state_id")
);

-- CreateTable
CREATE TABLE "transaction_history" (
    "th_id" SERIAL NOT NULL,
    "type" INTEGER,
    "invoice_id" INTEGER,
    "olb_id" INTEGER,
    "amount" DECIMAL(10,2) DEFAULT 0.00,
    "payment_status" INTEGER,
    "payment_remarks" VARCHAR(255),
    "transaction_ref_no" VARCHAR(255),
    "transaction_remarks" VARCHAR(500),
    "transaction_date" TIMESTAMP(3),
    "screenshot" VARCHAR(255),

    CONSTRAINT "transaction_history_pkey" PRIMARY KEY ("th_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_type_master_user_type_key" ON "user_type_master"("user_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_master_username_key" ON "user_master"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_master_token_key" ON "user_master"("token");

-- CreateIndex
CREATE INDEX "user_master_addedby_idx" ON "user_master"("addedby");

-- CreateIndex
CREATE INDEX "user_master_modifiedby_idx" ON "user_master"("modifiedby");

-- CreateIndex
CREATE INDEX "user_master_sq_id_idx" ON "user_master"("sq_id");

-- CreateIndex
CREATE INDEX "user_master_state_id_idx" ON "user_master"("state_id");

-- CreateIndex
CREATE INDEX "user_master_user_type_id_idx" ON "user_master"("user_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_master_user_type_id_user_code_key" ON "user_master"("user_type_id", "user_code");

-- CreateIndex
CREATE INDEX "chat_master_from_id_idx" ON "chat_master"("from_id");

-- CreateIndex
CREATE INDEX "chat_master_to_id_idx" ON "chat_master"("to_id");

-- CreateIndex
CREATE INDEX "notification_master_adv_pay_id_idx" ON "notification_master"("adv_pay_id");

-- CreateIndex
CREATE INDEX "notification_master_from_id_idx" ON "notification_master"("from_id");

-- CreateIndex
CREATE INDEX "notification_master_olb_id_idx" ON "notification_master"("olb_id");

-- CreateIndex
CREATE INDEX "notification_master_to_id_idx" ON "notification_master"("to_id");

-- CreateIndex
CREATE INDEX "olb_master_addedby_idx" ON "olb_master"("addedby");

-- CreateIndex
CREATE INDEX "olb_master_modifiedby_idx" ON "olb_master"("modifiedby");

-- CreateIndex
CREATE INDEX "olb_master_state_id_idx" ON "olb_master"("state_id");

-- CreateIndex
CREATE INDEX "project_master_addedby_idx" ON "project_master"("addedby");

-- CreateIndex
CREATE INDEX "project_master_modifiedby_idx" ON "project_master"("modifiedby");

-- CreateIndex
CREATE INDEX "project_master_state_id_idx" ON "project_master"("state_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_master_project_name_state_id_city_key" ON "project_master"("project_name", "state_id", "city");

-- CreateIndex
CREATE INDEX "adv_payment_history_master_addedby_idx" ON "adv_payment_history_master"("addedby");

-- CreateIndex
CREATE INDEX "adv_payment_master_addedby_idx" ON "adv_payment_master"("addedby");

-- CreateIndex
CREATE INDEX "handling_charges_project_id_idx" ON "handling_charges"("project_id");

-- CreateIndex
CREATE INDEX "handling_charges_state_id_idx" ON "handling_charges"("state_id");

-- CreateIndex
CREATE INDEX "invoice_master_addedby_idx" ON "invoice_master"("addedby");

-- CreateIndex
CREATE INDEX "invoice_master_adv_pay_id_idx" ON "invoice_master"("adv_pay_id");

-- CreateIndex
CREATE INDEX "invoice_master_adv_payment_received_by_idx" ON "invoice_master"("adv_payment_received_by");

-- CreateIndex
CREATE INDEX "invoice_master_advocate_id_idx" ON "invoice_master"("advocate_id");

-- CreateIndex
CREATE INDEX "invoice_master_agent_payment_received_by_idx" ON "invoice_master"("agent_payment_received_by");

-- CreateIndex
CREATE INDEX "invoice_master_olb_id_idx" ON "invoice_master"("olb_id");

-- CreateIndex
CREATE INDEX "invoice_master_pg_id_idx" ON "invoice_master"("pg_id");

-- CreateIndex
CREATE INDEX "invoice_master_project_id_idx" ON "invoice_master"("project_id");

-- CreateIndex
CREATE INDEX "invoice_master_state_id_idx" ON "invoice_master"("state_id");

-- CreateIndex
CREATE INDEX "invoice_payment_master_advocate_id_idx" ON "invoice_payment_master"("advocate_id");

-- CreateIndex
CREATE INDEX "invoice_payment_master_invoice_id_idx" ON "invoice_payment_master"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_payment_master_olb_id_idx" ON "invoice_payment_master"("olb_id");

-- CreateIndex
CREATE INDEX "invoice_payment_master_project_id_idx" ON "invoice_payment_master"("project_id");

-- CreateIndex
CREATE INDEX "login_history_user_id_idx" ON "login_history"("user_id");

-- CreateIndex
CREATE INDEX "olb_item_master_olb_id_idx" ON "olb_item_master"("olb_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateway_master_payment_gateway_key" ON "payment_gateway_master"("payment_gateway");

-- CreateIndex
CREATE UNIQUE INDEX "security_que_master_label_key" ON "security_que_master"("label");

-- CreateIndex
CREATE INDEX "state_master_addedby_idx" ON "state_master"("addedby");

-- CreateIndex
CREATE INDEX "state_master_modifiedby_idx" ON "state_master"("modifiedby");

-- CreateIndex
CREATE INDEX "transaction_history_invoice_id_idx" ON "transaction_history"("invoice_id");

-- CreateIndex
CREATE INDEX "transaction_history_olb_id_idx" ON "transaction_history"("olb_id");

-- AddForeignKey
ALTER TABLE "user_master" ADD CONSTRAINT "user_master_ibfk_1" FOREIGN KEY ("user_type_id") REFERENCES "user_type_master"("user_type_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user_master" ADD CONSTRAINT "user_master_ibfk_2" FOREIGN KEY ("state_id") REFERENCES "state_master"("state_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user_master" ADD CONSTRAINT "user_master_ibfk_3" FOREIGN KEY ("sq_id") REFERENCES "security_que_master"("sq_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "chat_master" ADD CONSTRAINT "chat_master_ibfk_1" FOREIGN KEY ("from_id") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "chat_master" ADD CONSTRAINT "chat_master_ibfk_2" FOREIGN KEY ("to_id") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_master" ADD CONSTRAINT "notification_master_ibfk_1" FOREIGN KEY ("from_id") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_master" ADD CONSTRAINT "notification_master_ibfk_2" FOREIGN KEY ("to_id") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_master" ADD CONSTRAINT "notification_master_ibfk_3" FOREIGN KEY ("olb_id") REFERENCES "olb_master"("olb_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_master" ADD CONSTRAINT "notification_master_ibfk_4" FOREIGN KEY ("adv_pay_id") REFERENCES "adv_payment_master"("adv_pay_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "olb_master" ADD CONSTRAINT "olb_master_ibfk_1" FOREIGN KEY ("state_id") REFERENCES "state_master"("state_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "olb_master" ADD CONSTRAINT "olb_master_ibfk_2" FOREIGN KEY ("addedby") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "olb_master" ADD CONSTRAINT "olb_master_ibfk_3" FOREIGN KEY ("modifiedby") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "project_master" ADD CONSTRAINT "project_master_ibfk_1" FOREIGN KEY ("state_id") REFERENCES "state_master"("state_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "project_master" ADD CONSTRAINT "project_master_ibfk_2" FOREIGN KEY ("addedby") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "project_master" ADD CONSTRAINT "project_master_ibfk_3" FOREIGN KEY ("modifiedby") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "adv_payment_master" ADD CONSTRAINT "adv_payment_master_ibfk_1" FOREIGN KEY ("addedby") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "handling_charges" ADD CONSTRAINT "handling_charges_ibfk_1" FOREIGN KEY ("state_id") REFERENCES "state_master"("state_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "handling_charges" ADD CONSTRAINT "handling_charges_ibfk_2" FOREIGN KEY ("project_id") REFERENCES "project_master"("project_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_ibfk_1" FOREIGN KEY ("olb_id") REFERENCES "olb_master"("olb_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_ibfk_2" FOREIGN KEY ("project_id") REFERENCES "project_master"("project_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_ibfk_3" FOREIGN KEY ("advocate_id") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_ibfk_4" FOREIGN KEY ("addedby") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_ibfk_5" FOREIGN KEY ("pg_id") REFERENCES "payment_gateway_master"("pg_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_ibfk_6" FOREIGN KEY ("state_id") REFERENCES "state_master"("state_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_ibfk_7" FOREIGN KEY ("adv_pay_id") REFERENCES "adv_payment_master"("adv_pay_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_ibfk_8" FOREIGN KEY ("agent_payment_received_by") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_ibfk_9" FOREIGN KEY ("adv_payment_received_by") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_payment_master" ADD CONSTRAINT "invoice_payment_master_ibfk_1" FOREIGN KEY ("invoice_id") REFERENCES "invoice_master"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payment_master" ADD CONSTRAINT "invoice_payment_master_ibfk_2" FOREIGN KEY ("olb_id") REFERENCES "olb_master"("olb_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_payment_master" ADD CONSTRAINT "invoice_payment_master_ibfk_3" FOREIGN KEY ("project_id") REFERENCES "project_master"("project_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_payment_master" ADD CONSTRAINT "invoice_payment_master_ibfk_4" FOREIGN KEY ("advocate_id") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "olb_item_master" ADD CONSTRAINT "olb_item_master_ibfk_1" FOREIGN KEY ("olb_id") REFERENCES "olb_master"("olb_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "state_master" ADD CONSTRAINT "state_master_ibfk_1" FOREIGN KEY ("addedby") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "state_master" ADD CONSTRAINT "state_master_ibfk_2" FOREIGN KEY ("modifiedby") REFERENCES "user_master"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "transaction_history" ADD CONSTRAINT "transaction_history_ibfk_1" FOREIGN KEY ("invoice_id") REFERENCES "invoice_master"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_history" ADD CONSTRAINT "transaction_history_ibfk_2" FOREIGN KEY ("olb_id") REFERENCES "olb_master"("olb_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

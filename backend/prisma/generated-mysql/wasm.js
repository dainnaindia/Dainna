
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserTypeScalarFieldEnum = {
  userTypeId: 'userTypeId',
  userType: 'userType'
};

exports.Prisma.UserScalarFieldEnum = {
  userId: 'userId',
  userTypeId: 'userTypeId',
  userCode: 'userCode',
  userCodeFull: 'userCodeFull',
  firstname: 'firstname',
  middlename: 'middlename',
  surname: 'surname',
  firmname: 'firmname',
  username: 'username',
  mobile: 'mobile',
  email: 'email',
  password: 'password',
  address: 'address',
  district: 'district',
  city: 'city',
  stateId: 'stateId',
  postcode: 'postcode',
  workingCity: 'workingCity',
  officePhone: 'officePhone',
  aadharNo: 'aadharNo',
  sqId: 'sqId',
  securityAns: 'securityAns',
  status: 'status',
  photo: 'photo',
  bankName: 'bankName',
  bankBranch: 'bankBranch',
  bankIfscCode: 'bankIfscCode',
  bankAcHolder: 'bankAcHolder',
  bankAcNo: 'bankAcNo',
  token: 'token',
  tokenExpires: 'tokenExpires',
  wrongPwdCount: 'wrongPwdCount',
  emailVerified: 'emailVerified',
  emailVerifiedOn: 'emailVerifiedOn',
  mobileVerified: 'mobileVerified',
  mobileVerifiedOn: 'mobileVerifiedOn',
  ratePerSqmt: 'ratePerSqmt',
  securePin: 'securePin',
  termsAccept: 'termsAccept',
  addedby: 'addedby',
  addeddate: 'addeddate',
  modifiedby: 'modifiedby',
  modifieddate: 'modifieddate'
};

exports.Prisma.ChatScalarFieldEnum = {
  chatId: 'chatId',
  systemEmailSms: 'systemEmailSms',
  type: 'type',
  supportType: 'supportType',
  fromId: 'fromId',
  toId: 'toId',
  message: 'message',
  status: 'status',
  sendtime: 'sendtime',
  receivetime: 'receivetime',
  seentime: 'seentime'
};

exports.Prisma.NotificationScalarFieldEnum = {
  notificationId: 'notificationId',
  fromId: 'fromId',
  toId: 'toId',
  olbId: 'olbId',
  advPayId: 'advPayId',
  action: 'action',
  title: 'title',
  message: 'message',
  status: 'status',
  sendtime: 'sendtime',
  receivetime: 'receivetime',
  seentime: 'seentime'
};

exports.Prisma.OlbScalarFieldEnum = {
  olbId: 'olbId',
  type: 'type',
  customizeReadymade: 'customizeReadymade',
  stateId: 'stateId',
  area: 'area',
  plotArea: 'plotArea',
  citySurveyOffice: 'citySurveyOffice',
  ward: 'ward',
  sheetNo: 'sheetNo',
  district: 'district',
  taluka: 'taluka',
  village: 'village',
  khataNo: 'khataNo',
  citySurveyNo: 'citySurveyNo',
  tpSchemeNo: 'tpSchemeNo',
  finalPlotNo: 'finalPlotNo',
  sectorNo: 'sectorNo',
  sectorPlotNo: 'sectorPlotNo',
  areaSqMt: 'areaSqMt',
  ownerFirstName: 'ownerFirstName',
  ownerMiddleName: 'ownerMiddleName',
  ownerLastName: 'ownerLastName',
  ownerMobileNo: 'ownerMobileNo',
  purchaserFirstName: 'purchaserFirstName',
  purchaserMiddleName: 'purchaserMiddleName',
  purchaserLastName: 'purchaserLastName',
  purchaserMobileNo: 'purchaserMobileNo',
  purchaserEmail: 'purchaserEmail',
  buildingName: 'buildingName',
  flatShopNo: 'flatShopNo',
  floorNo: 'floorNo',
  language: 'language',
  agreementDraft: 'agreementDraft',
  draftStatus: 'draftStatus',
  agreementAddeddate: 'agreementAddeddate',
  propertyDetail: 'propertyDetail',
  preparedDate: 'preparedDate',
  sentDate: 'sentDate',
  acceptDate: 'acceptDate',
  addedby: 'addedby',
  addeddate: 'addeddate',
  modifiedby: 'modifiedby',
  modifieddate: 'modifieddate'
};

exports.Prisma.ProjectScalarFieldEnum = {
  projectId: 'projectId',
  projectName: 'projectName',
  state_id: 'state_id',
  city: 'city',
  advocate_id: 'advocate_id',
  email: 'email',
  reg_link_sent_on: 'reg_link_sent_on',
  addedby: 'addedby',
  addeddate: 'addeddate',
  modifiedby: 'modifiedby',
  modifieddate: 'modifieddate'
};

exports.Prisma.Adv_payment_history_masterScalarFieldEnum = {
  adv_pay_history_id: 'adv_pay_history_id',
  adv_pay_id: 'adv_pay_id',
  transaction_id: 'transaction_id',
  transaction_date: 'transaction_date',
  payment_method: 'payment_method',
  remarks: 'remarks',
  amount: 'amount',
  payment_status: 'payment_status',
  payment_remarks: 'payment_remarks',
  addedby: 'addedby',
  addeddate: 'addeddate'
};

exports.Prisma.Adv_payment_masterScalarFieldEnum = {
  adv_pay_id: 'adv_pay_id',
  transaction_id: 'transaction_id',
  transaction_date: 'transaction_date',
  payment_method: 'payment_method',
  remarks: 'remarks',
  amount: 'amount',
  payment_status: 'payment_status',
  payment_remarks: 'payment_remarks',
  addedby: 'addedby',
  addeddate: 'addeddate'
};

exports.Prisma.Company_masterScalarFieldEnum = {
  company_id: 'company_id',
  company_name: 'company_name',
  company_alias: 'company_alias',
  company_code: 'company_code',
  address: 'address',
  phone: 'phone',
  mobile: 'mobile',
  email: 'email',
  gstin: 'gstin',
  pan_no: 'pan_no',
  state: 'state',
  state_code: 'state_code',
  city: 'city',
  country: 'country',
  zip_code: 'zip_code',
  bank_name: 'bank_name',
  bank_ac_no: 'bank_ac_no',
  bank_ifsc: 'bank_ifsc',
  bank_swift_code: 'bank_swift_code',
  bank_branch: 'bank_branch',
  active: 'active',
  addedby: 'addedby',
  addeddate: 'addeddate',
  modifiedby: 'modifiedby',
  modifieddate: 'modifieddate'
};

exports.Prisma.Handling_chargesScalarFieldEnum = {
  charge_id: 'charge_id',
  state_id: 'state_id',
  city: 'city',
  project_id: 'project_id',
  charge_in_perc: 'charge_in_perc',
  addedby: 'addedby',
  addeddate: 'addeddate',
  modifiedby: 'modifiedby',
  modifieddate: 'modifieddate'
};

exports.Prisma.Invoice_masterScalarFieldEnum = {
  invoice_id: 'invoice_id',
  olb_id: 'olb_id',
  project_id: 'project_id',
  advocate_id: 'advocate_id',
  customer_id: 'customer_id',
  state_id: 'state_id',
  inv_no: 'inv_no',
  invoice_no: 'invoice_no',
  invoice_date: 'invoice_date',
  size_width: 'size_width',
  size_height: 'size_height',
  size: 'size',
  rate: 'rate',
  final_rate: 'final_rate',
  total: 'total',
  sgst_rate: 'sgst_rate',
  sgst_amount: 'sgst_amount',
  cgst_rate: 'cgst_rate',
  cgst_amount: 'cgst_amount',
  igst_rate: 'igst_rate',
  igst_amount: 'igst_amount',
  handling_charge_rate: 'handling_charge_rate',
  handling_charge_amount: 'handling_charge_amount',
  grandtotal: 'grandtotal',
  adv_amount: 'adv_amount',
  razorpay_order_id: 'razorpay_order_id',
  razorpay_response: 'razorpay_response',
  payment_status: 'payment_status',
  payment_remarks: 'payment_remarks',
  transaction_ref_no: 'transaction_ref_no',
  transaction_remarks: 'transaction_remarks',
  pg_id: 'pg_id',
  adv_transaction_id: 'adv_transaction_id',
  adv_payment_date: 'adv_payment_date',
  adv_payment_method: 'adv_payment_method',
  adv_payment_remarks: 'adv_payment_remarks',
  adv_payment_status: 'adv_payment_status',
  adv_ps_remarks: 'adv_ps_remarks',
  adv_pay_id: 'adv_pay_id',
  addedby: 'addedby',
  addeddate: 'addeddate',
  agent_payment_received_by: 'agent_payment_received_by',
  agent_payment_received_date: 'agent_payment_received_date',
  adv_payment_received_by: 'adv_payment_received_by',
  adv_payment_received_date: 'adv_payment_received_date'
};

exports.Prisma.Invoice_payment_masterScalarFieldEnum = {
  ip_id: 'ip_id',
  invoice_id: 'invoice_id',
  olb_id: 'olb_id',
  project_id: 'project_id',
  advocate_id: 'advocate_id',
  payment_status: 'payment_status',
  razorpay_order_id: 'razorpay_order_id',
  razorpay_payment_id: 'razorpay_payment_id',
  payment_method: 'payment_method',
  bank_name: 'bank_name',
  merchant_order_id: 'merchant_order_id',
  transaction_id: 'transaction_id',
  entity: 'entity',
  razorpay_invoice_id: 'razorpay_invoice_id',
  international: 'international',
  amount_refunded: 'amount_refunded',
  refund_status: 'refund_status',
  captured: 'captured',
  description: 'description',
  card_id: 'card_id',
  wallet: 'wallet',
  vpa: 'vpa',
  fee: 'fee',
  tax: 'tax',
  error_code: 'error_code',
  error_description: 'error_description',
  error_source: 'error_source',
  error_step: 'error_step',
  error_reason: 'error_reason',
  razorpay_response: 'razorpay_response',
  created_at: 'created_at',
  addedby: 'addedby',
  addeddate: 'addeddate',
  modifiedby: 'modifiedby',
  modifieddate: 'modifieddate'
};

exports.Prisma.Login_historyScalarFieldEnum = {
  login_id: 'login_id',
  user_id: 'user_id',
  login_type: 'login_type',
  ip: 'ip',
  session_id: 'session_id',
  firebase_id: 'firebase_id',
  login_time: 'login_time',
  logout_time: 'logout_time'
};

exports.Prisma.Olb_item_masterScalarFieldEnum = {
  olb_item_id: 'olb_item_id',
  olb_id: 'olb_id',
  survey_no_new: 'survey_no_new',
  survey_no_old: 'survey_no_old'
};

exports.Prisma.Payment_gateway_masterScalarFieldEnum = {
  pg_id: 'pg_id',
  payment_gateway: 'payment_gateway'
};

exports.Prisma.Security_que_masterScalarFieldEnum = {
  sq_id: 'sq_id',
  label: 'label',
  addedby: 'addedby',
  addeddate: 'addeddate',
  modifiedby: 'modifiedby',
  modifieddate: 'modifieddate'
};

exports.Prisma.State_masterScalarFieldEnum = {
  state_id: 'state_id',
  state_code: 'state_code',
  state_name: 'state_name',
  addedby: 'addedby',
  addeddate: 'addeddate',
  modifiedby: 'modifiedby',
  modifieddate: 'modifieddate'
};

exports.Prisma.Transaction_historyScalarFieldEnum = {
  th_id: 'th_id',
  type: 'type',
  invoice_id: 'invoice_id',
  olb_id: 'olb_id',
  amount: 'amount',
  payment_status: 'payment_status',
  payment_remarks: 'payment_remarks',
  transaction_ref_no: 'transaction_ref_no',
  transaction_remarks: 'transaction_remarks',
  transaction_date: 'transaction_date',
  screenshot: 'screenshot'
};

exports.Prisma.ContactMessageScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  message: 'message',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  UserType: 'UserType',
  User: 'User',
  Chat: 'Chat',
  Notification: 'Notification',
  Olb: 'Olb',
  Project: 'Project',
  adv_payment_history_master: 'adv_payment_history_master',
  adv_payment_master: 'adv_payment_master',
  company_master: 'company_master',
  handling_charges: 'handling_charges',
  invoice_master: 'invoice_master',
  invoice_payment_master: 'invoice_payment_master',
  login_history: 'login_history',
  olb_item_master: 'olb_item_master',
  payment_gateway_master: 'payment_gateway_master',
  security_que_master: 'security_que_master',
  state_master: 'state_master',
  transaction_history: 'transaction_history',
  ContactMessage: 'ContactMessage'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)

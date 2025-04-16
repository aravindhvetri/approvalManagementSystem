//PeoplePicker Details:
export interface IPeoplePickerDetails {
  id: number;
  name: string;
  email: string;
}
//sideNav Details:
export interface ISideNavDetails {
  img: any;
  name: string;
  pageName: string;
}
//ListNames Details:
export interface IListNames {
  CategoryConfig: string;
  RequestsHub: string;
  ApprovalConfig: string;
  ApprovalStageConfig: string;
  CategorySectionConfig: string;
  SectionColumnsConfig: string;
  ApprovalHistory: string;
  EmailTemplateConfig: string;
  CategoryEmailConfig: string;
}
//Sp Group Name Details
export interface ISpGroupNames {
  RequestsAdmin: string;
}
//CategoryConfig Details:
export interface ICategoryDetails {
  id: number;
  category: string;
  isDelete: boolean;
  requestIdFormat: string;
}
//Approval Details patch:
export interface IApprovalDetailsPatch {
  apprvalFlowName: string;
  totalStages: number;
  rejectionFlow: string;
  stages: IApprovalStages[];
}
//ApprovalConfig Details
export interface IApprovalConfigDetails {
  id: number;
  category: [];
  apprvalFlowName: string;
  totalStages: number;
  rejectionFlow: string;
  stages: IApprovalStages[];
}
export interface IApprovalStages {
  stage: number;
  approvalProcess: number;
  approver: IPeoplePickerDetails[];
}
//Dropdown Details:
export interface IBasicDropDown {
  name: string;
}
export interface IBasicFilterCategoryDrop {
  name: string;
  id: number;
}
export interface IDropdownDetails {
  categoryDrop: IBasicFilterCategoryDrop[];
  approvelProcess: IBasicDropDown[];
  rejectionFlowDrop: IBasicDropDown[];
  approvalFlowType: IBasicFilterCategoryDrop[];
}
//View and Edit Obj:
export interface IActionBooleans {
  isEdit: boolean;
  isView: boolean;
}
//RightSideBarContents Details:
export interface IRightSideBarContents {
  categoryConfigContent: string;
  ApprovalConfigContent: string;
  RequestsDashBoardContent: string;
  AddRequestsDashBoardContent: string;
  EmailWorkFlowContent: string;
}
//RightSideBarContents Initialize Details:
export interface IRightSideBarContentsDetails {
  addRequestDetails: boolean;
  categoryConfigDetails: boolean;
  approvalConfigDetails: boolean;
}
//Page Name
export interface ISideNavPageNames {
  Request: string;
  ApproveConfig: string;
  CategoryConfig: string;
}

//User Details
export interface IUserDetails {
  name: string;
  email: string;
}

//Toast Message Details:
export interface IToaster {
  iconName: string;
  ClsName: string;
  type: "Warning" | "Success" | "Alert";
  msg: string;
}

//RequestHub Details:
export interface IRequestHubDetails {
  id: number;
  requestId: string;
  status: string;
  category: string;
  CategoryId: number;
  approvalJson: IApprovalFlow[];
  createdDate: string;
  author: IPeoplePickerDetails;
}

export interface IApprovalFlow {
  ApprovalFlowName: string;
  Currentstage: number;
  TotalStages: number;
  RejectionFlow: number;
  stages: Stage[];
}
interface Stage {
  stage: number;
  ApprovalType: number;
  stageStatusCode: number;
  approvers: Approver[];
}
interface Approver {
  id: number;
  name: string;
  email: string;
  statusCode: number;
}
//LibraryNames Details:
export interface ILibraryNames {
  AttachmentsLibrary: string;
}

//SectionColumnsConfiguration Details:
export interface ISectionColumnsConfig {
  id: number;
  sectionName: string;
  columnName: string;
  columnDisplayName: string;
  columnType: string;
  isRequired: boolean;
  viewStage: IViewStage[];
  choices: [];
}
interface IViewStage {
  Stage: [];
}

//TabView Details
export interface ITabviewDetails {
  id: number;
  name: string;
}

//Approval Details
export interface IApprovalDetails {
  parentID: number;
  stage: number;
  approverEmail: string;
  status: string;
  comments: string;
}

//Approval History Details
export interface IApprovalHistoryDetails {
  createdDate: string;
  itemID: number;
  stage: number;
  approver: IPeoplePickerDetails;
  status: string;
  comments: string;
}

//EmailTemplateContents Details
export interface IEmailTemplateConfigDetails {
  id: number;
  templateName: string;
  emailBody: string;
}

//Next Stage From Category RighSideBar:
export interface INextStageFromCategorySideBar {
  ApproverSection: boolean;
  dynamicSectionWithField: boolean;
  EmailTemplateSection: boolean;
}

//Approval Stage Error Details
export interface IApprovalFlowValidation {
  approvalConfigValidation: string;
  stageValidation: string;
  stageErrIndex: number[];
}

//Category Config Last Final Submit Interface:
export interface IFinalSubmitDetails {
  categoryConfig: {
    category: string;
    requestIdFormat: string;
    ExistingApprover: number;
    customApprover: {};
  };
  dynamicSectionWithField: [];
}

//CategoryEmailConfigDetails Interface
export interface ICategoryEmailConfigDetails {
  templateName: string;
  emailBody: string;
  status: number;
}

//email Message details
export interface IemailMessage {
  To: string[];
  Subject: string;
  Body: string;
}

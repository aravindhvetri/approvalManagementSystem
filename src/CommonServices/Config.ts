//interFace Imports:
import {
  IActionBooleans,
  IApprovalDetailsPatch,
  IApprovalFlowValidation,
  ICategoryEmailConfigDetails,
  IDropdownDetails,
  IemailMessage,
  IEmailTemplateConfigDetails,
  IFinalSubmitDetails,
  ILibraryNames,
  IListNames,
  INextStageFromCategorySideBar,
  IRequestHubDetails,
  IRightSideBarContents,
  IRightSideBarContentsDetails,
  ISectionColumnsConfig,
  ISideNavPageNames,
  ISpGroupNames,
  ITabviewDetails,
} from "./interface";

//ListNames Config:
export namespace Config {
  export const ListNames: IListNames = {
    CategoryConfig: "CategoryConfig",
    RequestsHub: "RequestsHub",
    ApprovalConfig: "ApprovalConfig",
    ApprovalStageConfig: "ApprovalStageConfig",
    CategorySectionConfig: "CategorySectionConfig",
    SectionColumnsConfig: "SectionColumnsConfig",
    ApprovalHistory: "ApprovalHistory",
    EmailTemplateConfig: "EmailTemplateConfig",
    CategoryEmailConfig: "CategoryEmailConfig",
  };

  //SharePoint Group Names config
  export const spGroupNames: ISpGroupNames = {
    RequestsAdmin: "RequestsAdmin",
  };

  //Dropdown Config:
  export const initialConfigDrop: IDropdownDetails = {
    categoryDrop: [],
    approvelProcess: [],
    rejectionFlowDrop: [],
    approvalFlowType: [
      { name: "Everyone should approve", id: 2 },
      { name: "Anyone can approve", id: 1 },
    ],
  };

  //View and Edit Obj:
  export const InitialActionsBooleans: IActionBooleans = {
    isEdit: false,
    isView: false,
  };

  //RightSideBarContents Config:
  export const rightSideBarContents: IRightSideBarContents = {
    categoryConfigContent: "",
    ApprovalConfigContent: "",
    RequestsDashBoardContent: "",
    AddRequestsDashBoardContent: "",
    EmailWorkFlowContent: "",
  };

  //RightSideBarContents Initialize Details:
  export const rightSideBarContentsDetails: IRightSideBarContentsDetails = {
    addRequestDetails: false,
    categoryConfigDetails: false,
    approvalConfigDetails: false,
  };

  //PageNames Config:
  export const sideNavPageNames: ISideNavPageNames = {
    Request: "Request",
    ApproveConfig: "ApproveConfig",
    CategoryConfig: "CategoryConfig",
  };

  //RequestHub Config:
  export const RequestHubDetails: IRequestHubDetails = {
    id: null,
    requestId: "",
    status: "",
    category: "",
    CategoryId: null,
    approvalJson: [],
    createdDate: "",
    author: { id: null, email: "", name: "" },
  };

  //LibraryNames Config:
  export const LibraryNames: ILibraryNames = {
    AttachmentsLibrary: "AttachmentsLibrary",
  };

  //SecionColumnsConfiguration Details:
  export const SectionColumnsConfigDetails: ISectionColumnsConfig = {
    id: null,
    sectionName: "",
    columnName: "",
    columnDisplayName: "",
    columnType: "",
    isRequired: false,
    viewStage: [],
    choices: [],
  };

  //TabViewContent Config
  export const TabViewConfigDetails: ITabviewDetails = {
    id: null,
    name: "",
  };

  //EmailTemplateContents Config
  export const EmailTemplateConfigDetails: IEmailTemplateConfigDetails = {
    id: null,
    templateName: "",
    emailBody: "",
  };

  //Next Stage From Category RighSideBar:
  export const NextStageFromCategorySideBar: INextStageFromCategorySideBar = {
    ApproverSection: true,
    dynamicSectionWithField: false,
    EmailTemplateSection: false,
  };

  //Approval Config Details
  export const ApprovalConfigDefaultDetails: IApprovalDetailsPatch = {
    apprvalFlowName: "",
    totalStages: null,
    rejectionFlow: "",
    stages: [],
  };

  //Approval Stage Error Details
  export const ApprovalFlowValidation: IApprovalFlowValidation = {
    approvalConfigValidation: "",
    stageValidation: "",
    stageErrIndex: [],
  };

  //Category Config Last Final Submit Details:
  export const finalSubmitDetails: IFinalSubmitDetails = {
    categoryConfig: {
      category: "",
      requestIdFormat: "",
      ExistingApprover: null,
      customApprover: null,
    },
    dynamicSectionWithField: [],
  };

  //CategoryEmail Config Details :
  export const CategoryEmailConfigDefault: ICategoryEmailConfigDetails = {
    templateName: "",
    emailBody: "",
    status: null,
  };

  //Email Message Config Details
  export const emailMessageConfig: IemailMessage = {
    To: [],
    Subject: "",
    Body: "",
  };
}

//interFace Imports:
import {
  IActionBooleans,
  IApprovalDetailsPatch,
  IApprovalFlowValidation,
  IApproverOptions,
  IApproverSignatureFeildConfig,
  ICardDataCountDetails,
  ICategoryDraft,
  ICategoryEmailConfigDetails,
  IDelModal,
  IDropdownDetails,
  IemailMessage,
  IEmailTemplateConfigDetails,
  IFinalSubmitDetails,
  ILibraryNames,
  IListNames,
  INextStageFromCategorySideBar,
  IRequestHubDetails,
  IRequestIdFormatWithDigit,
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
    emailBody: ` <p>Dear [$ToPerson],</p>

    <p>
      I hope this message finds you well. A new request has been submitted and requires your review and approval.
    </p>

    <p><strong>Request Details:</strong></p>
    <ul>
      <li><strong>Request ID:</strong> [$RequestID]</li>
      <li><strong>Submitted By:</strong> [$Requestor]</li>
      <li><strong>Date Submitted:</strong> [$RequestDate]</li>
      <li><strong>Details:</strong> [$RequestDetails]</li>
    </ul>

    <p>
      Please review the request and take the necessary action.
    </p>

    <p>Thank you,<br />
    [$Requestor]</p>`,
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
      requestIdDigit: "",
      ExistingApprover: null,
      customApprover: ApprovalConfigDefaultDetails,
      isApproverSignRequired: false,
      viewApproverSignStages: [],
    },
    dynamicSectionWithField: [],
  };

  export const CategoryEmailConfigDefault: ICategoryEmailConfigDetails[] = [
    {
      templateName: "",
      emailBody: ` <p>Dear [$ToPerson],</p>

    <p>
      I hope this message finds you well. A new request has been submitted and requires your review and approval.
    </p>

    <p><strong>Request Details:</strong></p>
    <ul>
      <li><strong>Request ID:</strong> [$RequestID]</li>
      <li><strong>Submitted By:</strong> [$Requestor]</li>
      <li><strong>Date Submitted:</strong> [$RequestDate]</li>
      <li><strong>Details:</strong> [$RequestDetails]</li>
    </ul>

    <p>
      Please review the request and take the necessary action.
    </p>

    <p>Thank you,<br />
    [$Requestor]</p>`,
      status: "Approval",
    },
    {
      templateName: "",
      emailBody: ` <p>Dear [$ToPerson],</p>

    <p>
      I hope this message finds you well. A new request has been submitted and requires your review and approval.
    </p>

    <p><strong>Request Details:</strong></p>
    <ul>
      <li><strong>Request ID:</strong> [$RequestID]</li>
      <li><strong>Submitted By:</strong> [$Requestor]</li>
      <li><strong>Date Submitted:</strong> [$RequestDate]</li>
      <li><strong>Details:</strong> [$RequestDetails]</li>
    </ul>

    <p>
      Please review the request and take the necessary action.
    </p>

    <p>Thank you,<br />
    [$Requestor]</p>`,
      status: "Reject",
    },
    {
      templateName: "",
      emailBody: ` <p>Dear [$ToPerson],</p>

    <p>
      I hope this message finds you well. A new request has been submitted and requires your review and approval.
    </p>

    <p><strong>Request Details:</strong></p>
    <ul>
      <li><strong>Request ID:</strong> [$RequestID]</li>
      <li><strong>Submitted By:</strong> [$Requestor]</li>
      <li><strong>Date Submitted:</strong> [$RequestDate]</li>
      <li><strong>Details:</strong> [$RequestDetails]</li>
    </ul>

    <p>
      Please review the request and take the necessary action.
    </p>

    <p>Thank you,<br />
    [$Requestor]</p>`,
      status: "ReSubmit",
    },
    {
      templateName: "",
      emailBody: ` <p>Dear [$ToPerson],</p>

    <p>
      I hope this message finds you well. A new request has been submitted and requires your review and approval.
    </p>

    <p><strong>Request Details:</strong></p>
    <ul>
      <li><strong>Request ID:</strong> [$RequestID]</li>
      <li><strong>Submitted By:</strong> [$Requestor]</li>
      <li><strong>Date Submitted:</strong> [$RequestDate]</li>
      <li><strong>Details:</strong> [$RequestDetails]</li>
    </ul>

    <p>
      Please review the request and take the necessary action.
    </p>

    <p>Thank you,<br />
    [$Requestor]</p>`,
      status: "Submit",
    },
  ];

  //Email Message Config Details:
  export const emailMessageConfig: IemailMessage = {
    To: [],
    Subject: "",
    Body: "",
  };

  //Request ID Format with digit:
  export const requestIdFormatWithDigit: IRequestIdFormatWithDigit = {
    format: "",
    digit: "",
  };

  //Approver Signature Confid details:
  export const approverSignatureFieldConfig: IApproverSignatureFeildConfig = {
    isMandatory: false,
    ViewStages: [],
  };

  //card Data Count Details
  export const cardDataCountDetailsConfig: ICardDataCountDetails = {
    name: "Loading....",
    count: 0,
    icon: null,
  };

  //Draft Category Config
  export const draftedCategoryDetails: ICategoryDraft = {
    isDraft: false,
    draftedState: null,
  };

  //Delete confirmation Details:
  export const initialdelModal: IDelModal = {
    isOpen: false,
    id: null,
  };

  //Approvers Config DropDown Details:
  export const approverOptions: IApproverOptions[] = [
    { label: "Existing approver", value: "existing" },
    { label: "Custom approver", value: "custom" },
  ];

  //Toast common Messages:
  export const ToastCommonMessage =
    "Please cancel or save the currently open field form before proceeding to the next action";
}

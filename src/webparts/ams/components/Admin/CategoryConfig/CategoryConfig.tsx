//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//Common Service Imports:
import SPServices from "../../../../../CommonServices/SPServices";
import { Config } from "../../../../../CommonServices/Config";
import {
  IActionBooleans,
  IApprovalFlowValidation,
  IApprovalStages,
  IApproverSignatureFeildConfig,
  ICategoryDetails,
  ICategoryDraft,
  IDelModal,
  IFinalSubmitDetails,
  INextStageFromCategorySideBar,
  IRequestIdFormatWithDigit,
  IRightSideBarContents,
} from "../../../../../CommonServices/interface";
import {
  ActionsMenu,
  cardStatusTemplate,
  customHeader,
  toastNotify,
} from "../../../../../CommonServices/CommonTemplates";
//Styles Imports:
import "../../../../../External/style.css";
import categoryConfigStyles from "./CategoryConfig.module.scss";
//primeReact Imports:
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { BiCategory } from "react-icons/bi";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Label } from "office-ui-fabric-react";
import ExistingApprover from "./ExistingApprover";
import CustomApprover from "./CustomApprover";
import { Button } from "primereact/button";
import { BiSolidCategory } from "react-icons/bi";
import { FaCheck } from "react-icons/fa";
import { LuWorkflow } from "react-icons/lu";
import { RiDeleteBinLine } from "react-icons/ri";
//Component Imports:
import DynamicSectionWithField from "./DynamicSectionWithField/DynamicSectionWithField";
import EmailContainer from "./EmailTemplate/EmailContainer";
import Loader from "../../Loader/Loader";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";

const CategoryConfig = ({
  context,
  getCategoryFunction,
  selectedCategory,
  setCategorySideBarContent,
  ApprovalConfigSideBarVisible,
  setCategorySideBarVisible,
}) => {
  //state variables:
  const steps = ["Category Config", "Dynamic Fields", "Email Config"];
  const [activeStep, setActiveStep] = useState(0);
  const [delModal, setDelModal] = useState<IDelModal>({
    ...Config.initialdelModal,
  });
  const toast = useRef<Toast>(null);
  const [categoryDetails, setCategoryDetails] = useState<ICategoryDetails[]>(
    []
  );
  const [categoryInputs, setCategoryInputs] = useState<string>("");
  const [requestInput, setRequestFormatInput] =
    useState<IRequestIdFormatWithDigit>({
      ...Config.requestIdFormatWithDigit,
    });
  const [categoryDraft, setCategoryDraft] = useState<ICategoryDraft>({
    ...Config.draftedCategoryDetails,
  });
  const [approverSignatureDetails, setApproverSignatureDetails] =
    useState<IApproverSignatureFeildConfig>({
      ...Config.approverSignatureFieldConfig,
    });
  const [actionsBooleans, setActionsBooleans] = useState<IActionBooleans>({
    ...Config.InitialActionsBooleans,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [approvalSignStage, setApprovalSignStage] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState<string>("");
  const [nextStageFromCategory, setNextStageFromCategory] =
    useState<INextStageFromCategorySideBar>({
      ...Config.NextStageFromCategorySideBar,
    });
  const childRef = useRef(null);
  const [validateError, setValidateError] = useState({
    categoryName: "",
    approversSelected: "",
    requestInput: "",
    digit: "",
    signatureShowStages: "",
  });
  const [finalSubmit, setFinalSubmit] = useState<IFinalSubmitDetails>({
    ...Config.finalSubmitDetails,
  });
  const [showLoader, setShowLoader] = useState<boolean>(true);
  //Get Category Config Details:
  const getCategoryConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CategoryConfig,
      Orderby: "Modified",
      Orderbydecorasc: false,
      Select: "*",
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res: any) => {
        const tempCategoryArray: ICategoryDetails[] = [];
        res.forEach((items: any) => {
          tempCategoryArray.push({
            id: items?.ID,
            category: items?.Category ? items?.Category : "",
            isDelete: items?.IsDelete,
            requestIdFormat: items?.RequestIdFormat
              ? items?.RequestIdFormat
              : "",
            requestIdDigit: items?.RequestIdDigits
              ? items?.RequestIdDigits
              : "",
            isApproverSignRequired: items?.IsApproverSignRequired,
            viewApproverSignStages:
              items?.ViewApproverSignStages &&
              JSON.parse(items?.ViewApproverSignStages)[0].Stage?.map(
                (e: any) => "Stage " + e
              ),
            isDraft: items?.IsDraft,
            draftedState: items?.DraftedState,
          });
        });
        setCategoryDetails([...tempCategoryArray]);
        setShowLoader(false);
      })
      .catch((err) => {
        console.log("Get Category Config Error", err);
      });
  };

  //Set Actions PopUp:
  const actionsWithIcons = (rowData: ICategoryDetails) => [
    {
      label: "View",
      icon: "pi pi-eye",
      className: "customView",
      command: async () => {
        await setActionsBooleans((prev) => ({
          ...prev,
          isView: true,
        }));
        handleActionClick(rowData);
      },
    },
    {
      label: "Edit",
      icon: "pi pi-file-edit",
      className: "customEdit",
      command: async () => {
        await setActionsBooleans((prev) => ({
          ...prev,
          isEdit: true,
        }));
        handleActionClick(rowData);
      },
    },
    {
      label: "Delete",
      className: "customDelete",
      icon: "pi pi-trash",
      // command: () => isDeleteCategory(rowData?.id),
      command: () => setDelModal({ isOpen: true, id: rowData?.id }),
    },
  ];

  //Handle View and Edit Actions:
  const handleActionClick = async (rowData: ICategoryDetails) => {
    setCategoryInputs(rowData?.category);
    setRequestFormatInput((prev: IRequestIdFormatWithDigit) => ({
      ...prev,
      format: rowData?.requestIdFormat,
      digit: rowData?.requestIdDigit,
    }));
    setCategoryDraft({
      isDraft: rowData?.isDraft,
      draftedState: rowData?.draftedState,
    });
    setApproverSignatureDetails((prev: IApproverSignatureFeildConfig) => ({
      ...prev,
      ViewStages: rowData?.viewApproverSignStages,
      isMandatory: rowData?.isApproverSignRequired,
    }));
    await setSelectedCategoryId(rowData?.id);
    setCategorySideBarVisible(true);
    // setShowLoader(false);
  };

  //Render Status Column:
  const renderStatusColumn = (rowData: ICategoryDetails) => {
    return (
      <div>
        {cardStatusTemplate(rowData?.isDraft == true ? "Draft" : "Active")}
      </div>
    );
  };

  //Render Action Column:
  const renderActionColumn = (rowData: ICategoryDetails) => {
    const menuModel = actionsWithIcons(rowData);
    return <ActionsMenu items={menuModel} />;
  };

  //IsDelete update for categroy
  const isDeleteCategory = () => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames.CategoryConfig,
      ID: delModal.id,
      RequestJSON: {
        IsDelete: true,
      },
    }).then((res) => {
      getCategoryConfigDetails();
      setDelModal({ isOpen: false, id: null });
    });
  };

  //Category in draft
  const draftCategory = async () => {
    if (selectedCategoryId) {
      try {
        const res = await SPServices.SPUpdateItem({
          Listname: Config.ListNames.CategoryConfig,
          ID: selectedCategoryId,
          RequestJSON: {
            Category: finalSubmit?.categoryConfig?.category,
            RequestIdFormat: finalSubmit?.categoryConfig?.requestIdFormat,
            RequestIdDigits: finalSubmit?.categoryConfig?.requestIdDigit,
            ViewApproverSignStages: `[{"Stage": ${JSON.stringify(
              finalSubmit?.categoryConfig?.viewApproverSignStages
                .map((item) => parseInt(item.split(" ")[1]))
                .sort((x, y) => x - y)
            )}}]`,
            IsApproverSignRequired:
              finalSubmit?.categoryConfig?.isApproverSignRequired,
            IsDraft: true,
            DraftedState: activeStep,
          },
        });
        alert("Process completed successfully!");
        sessionStorage.clear();
        getCategoryConfigDetails();
        setCategorySideBarVisible(false);
      } catch {
        (err) => console.log("Draft category details err", err);
      }
    } else {
      try {
        if (finalSubmit?.categoryConfig?.category !== "") {
          const res = await SPServices.SPAddItem({
            Listname: Config.ListNames.CategoryConfig,
            RequestJSON: {
              Category: finalSubmit?.categoryConfig?.category,
              RequestIdFormat: finalSubmit?.categoryConfig?.requestIdFormat,
              RequestIdDigits: finalSubmit?.categoryConfig?.requestIdDigit,
              ViewApproverSignStages: `[{"Stage": ${JSON.stringify(
                finalSubmit?.categoryConfig?.viewApproverSignStages
                  .map((item) => parseInt(item.split(" ")[1]))
                  .sort((x, y) => x - y)
              )}}]`,
              IsApproverSignRequired:
                finalSubmit?.categoryConfig?.isApproverSignRequired,
              IsDraft: true,
              DraftedState: activeStep,
            },
          });

          if (res?.data?.ID) {
            const newCategoryId = res?.data?.ID; // Use a variable instead of state

            if (finalSubmit?.categoryConfig?.ExistingApprover !== null) {
              const existingApprovalConfig: any = await SPServices.SPReadItems({
                Listname: Config.ListNames.ApprovalConfig,
                Select: "ID,CategoryId",
                Filter: [
                  {
                    FilterKey: "ID",
                    Operator: "eq",
                    FilterValue:
                      finalSubmit?.categoryConfig?.ExistingApprover.toString(),
                  },
                ],
              });

              let existingCategories =
                existingApprovalConfig[0]?.CategoryId || [];
              existingCategories.push(newCategoryId);

              await SPServices.SPUpdateItem({
                Listname: Config.ListNames.ApprovalConfig,
                ID: finalSubmit?.categoryConfig?.ExistingApprover,
                RequestJSON: {
                  CategoryId: { results: existingCategories },
                },
              });
            }
            if (finalSubmit?.categoryConfig?.ExistingApprover === null) {
              const customApprovalConfigRes = await SPServices.SPAddItem({
                Listname: Config.ListNames.ApprovalConfig,
                RequestJSON: {
                  CategoryId: { results: [newCategoryId] },
                  ApprovalFlowName:
                    finalSubmit?.categoryConfig?.customApprover
                      ?.apprvalFlowName,
                  TotalStages:
                    finalSubmit?.categoryConfig?.customApprover?.totalStages,
                  RejectionFlow:
                    finalSubmit?.categoryConfig?.customApprover?.rejectionFlow,
                },
              });

              await finalSubmit?.categoryConfig?.customApprover?.stages?.forEach(
                (stage) =>
                  addApprovalStageConfigDetails(
                    customApprovalConfigRes?.data.ID,
                    stage
                  )
              );
            }
          }
        }
        alert("Process completed successfully!");
        sessionStorage.clear();
        getCategoryConfigDetails();
        setCategorySideBarVisible(false);
      } catch {
        (err) => console.log("Draft category details err", err);
      }
    }
  };

  //Approver Configuration:
  const ApproverConfiguration = (e: any) => {
    const selected = e.value;

    setSelectedApprover(selected);
    setValidateError((prev) => ({
      ...prev,
      signatureShowStages: "",
    }));
    setApproverSignatureDetails({
      ...Config.approverSignatureFieldConfig,
    });
    setApprovalSignStage([]);

    if (selected === "existing") {
      setFinalSubmit((prev: IFinalSubmitDetails) => ({
        ...prev,
        categoryConfig: {
          ...prev.categoryConfig,
          customApprover: {
            ...Config.ApprovalConfigDefaultDetails,
          },
        },
      }));
      sessionStorage.removeItem("approvalFlowDetails");
    } else if (selected === "custom") {
      setFinalSubmit((prev: IFinalSubmitDetails) => ({
        ...prev,
        categoryConfig: {
          ...prev.categoryConfig,
          ExistingApprover: null,
        },
      }));
      sessionStorage.removeItem("selectedFlow");
      sessionStorage.removeItem("selectedFlowID");
    }
  };

  //ApprovalStageConfig Details Patch:
  const addApprovalStageConfigDetails = (
    parentId: number,
    stage: IApprovalStages
  ) => {
    const tempApprovers = stage?.approver?.map((e) => e.id);
    SPServices.SPAddItem({
      Listname: Config.ListNames.ApprovalStageConfig,
      RequestJSON: {
        ParentApprovalId: parentId,
        Stage: stage?.stage,
        ApprovalProcess: stage?.approvalProcess,
        ApproverId: { results: tempApprovers },
      },
    })
      .then((res: any) => {})
      .catch((err) => console.log("addApprovalStageConfigDetails error", err));
  };

  const finalValidation = async (Isdraft: boolean) => {
    let isValid = true;
    // Category name validation
    if (categoryInputs === "") {
      validateError.categoryName = "Category name is mandatory";
      isValid = false;
    } else {
      validateError.categoryName = "";
    }
    //Request Id format validation
    if (requestInput?.format === "") {
      validateError.requestInput = "Request Id format is mandatory";
      isValid = false;
    } else {
      validateError.requestInput = "";
    }
    //Request Id digit validation
    if (requestInput?.digit === "") {
      validateError.digit = "Request Id digit is mandatory";
      isValid = false;
    } else {
      validateError.digit = "";
    }
    //Signature stages
    // if (approverSignatureDetails?.ViewStages.length === 0) {
    //   validateError.signatureShowStages =
    //     "Atleast one stage is required to shows signature field";
    //   isValid = false;
    // } else {
    //   validateError.signatureShowStages = "";
    // }
    // Approver validation
    if (!actionsBooleans?.isEdit && !actionsBooleans?.isView) {
      if (selectedApprover === "") {
        validateError.approversSelected =
          "Approval flow is mandatory for approval process";
        isValid = false;
      } else {
        if (selectedApprover === "existing") {
          const selectedFlow = sessionStorage.getItem("selectedFlow");
          if (!selectedFlow) {
            // validateError.approversSelected = "Please select an existing flow";
            toast.current.show({
              severity: "warn",
              summary: "Warning",
              content: (prop) =>
                toastNotify({
                  iconName: "pi-exclamation-triangle",
                  ClsName: "toast-imgcontainer-warning",
                  type: "Warning",
                  msg: "Please select an existing flow",
                  image: require("../../../../../../src/webparts/ams/assets/giphy.gif"),
                }),
              life: 3000,
            });
            isValid = false;
          } else {
            validateError.approversSelected = "";
          }
        }

        if (selectedApprover === "custom") {
          let tempRunfunction = await childRef.current?.ValidationFunc();
          if (!tempRunfunction) {
            isValid = false;
          }
        }
      }
    }

    // Update the validation error state
    setValidateError({ ...validateError });

    // If everything is valid, move to next section
    if (isValid) {
      if (!Isdraft) {
        setNextStageFromCategory((prev: INextStageFromCategorySideBar) => ({
          ...prev,
          dynamicSectionWithField: true,
          ApproverSection: false,
        }));
        next();
      } else if (Isdraft) {
        draftCategory();
      }
    }
  };

  const next = () => {
    setActiveStep(1);
  };

  //Get Approval Stage Count
  const getApprovalStageCount = async () => {
    var totalStages = 0;
    if (
      (selectedApprover === "custom" ||
        ((actionsBooleans.isEdit || actionsBooleans.isView) &&
          finalSubmit?.categoryConfig?.customApprover)) &&
      finalSubmit?.categoryConfig?.customApprover?.["totalStages"]
    ) {
      totalStages =
        finalSubmit?.categoryConfig?.customApprover?.["totalStages"];
    } else if (
      (selectedApprover === "existing" ||
        ((actionsBooleans.isEdit || actionsBooleans.isView) &&
          finalSubmit?.categoryConfig?.ExistingApprover)) &&
      finalSubmit?.categoryConfig?.ExistingApprover
    ) {
      const flowID = finalSubmit?.categoryConfig?.ExistingApprover;
      await SPServices.SPReadItemUsingID({
        Listname: Config.ListNames.ApprovalConfig,
        SelectedId: flowID,
      })
        .then((res: any) => {
          return (totalStages = res?.TotalStages);
        })
        .catch((err) => console.log("ApprovalConfig get error", err));
    }
    const tempStageArr = [];
    if (totalStages > 0) {
      for (let i = 1; i <= totalStages; i++) {
        tempStageArr.push({ label: "Stage " + i, value: "Stage " + i });
        setApprovalSignStage([...tempStageArr]);
      }
    } else {
      setApprovalSignStage([]);
    }
  };

  const stepTemplate = (item, index) => {
    const isCompleted = index < activeStep;
    const isCurrent = index === activeStep;

    return (
      <div className="step-item">
        <span
          className={`step-circle ${
            isCompleted ? "completed" : isCurrent ? "current" : "upcoming"
          }`}
        >
          {isCompleted ? <FaCheck size={10} /> : index + 1}
        </span>
        <span className="step-label">{item.label}</span>
      </div>
    );
  };

  //CategoryRightSideBar Contents:
  const categoryConfigSideBarContents = () => {
    return (
      <>
        <div className="profile_header_content">
          <div>
            <span>
              {actionsBooleans.isView
                ? "View"
                : actionsBooleans.isEdit
                ? "Edit"
                : "Create"}{" "}
              Category Details
            </span>
            <p>
              {actionsBooleans.isView
                ? "View the category details for your reference."
                : actionsBooleans.isEdit
                ? "Update category details and manage the workflows for the future request."
                : "Set up a new category and the entire workflows for the future request."}
            </p>
          </div>
          <div className="custom-steps-wrapper">
            {steps.map((label, index) => (
              <div className="custom-step" key={index}>
                <div
                  className={`step-circle ${
                    index < activeStep
                      ? "completed"
                      : index === activeStep
                      ? "active"
                      : ""
                  }`}
                >
                  {index < activeStep ? <FaCheck size={10} /> : index + 1}
                </div>
                {/* <div className="step-label">{label}</div> */}
                {index !== steps.length - 1 && (
                  <div
                    className={`step-line ${
                      index < activeStep ? "completed" : ""
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div
            className={`${categoryConfigStyles.categoryConfigFields} ${
              activeStep == 1 || activeStep == 2
                ? categoryConfigStyles.categoryConfigFieldsDynamicSectionsHeight
                : ""
            }`}
          >
            {nextStageFromCategory.ApproverSection ? (
              <div className={categoryConfigStyles.categoryConfigChild}>
                {nextStageFromCategory.dynamicSectionWithField ||
                nextStageFromCategory.EmailTemplateSection ? (
                  <></>
                ) : (
                  <>
                    <div className="workFlowHeaderContainer">
                      <div className="workFlowHeaderIcon">
                        <LuWorkflow />
                      </div>
                      <div style={{ fontFamily: "interSemiBold" }}>
                        Workflow Information
                      </div>
                    </div>
                    <span className="overAllHeading ">Basic Information</span>
                    <div className={`${categoryConfigStyles.inputDiv}`}>
                      <div className={`${categoryConfigStyles.inputChildDiv}`}>
                        <Label className={`${categoryConfigStyles.label}`}>
                          Category<span className="required">*</span>
                        </Label>
                        <InputText
                          className={`inputField ${categoryConfigStyles.input}`}
                          value={categoryInputs}
                          disabled={actionsBooleans.isView}
                          placeholder="Enter Category"
                          onChange={(e) => setCategoryInputs(e.target.value)}
                        />
                        {validateError && !categoryInputs && (
                          <div>
                            <span className="errorMsg">
                              {validateError?.categoryName}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={`${categoryConfigStyles.inputChildDiv}`}>
                        <Label className={`${categoryConfigStyles.label}`}>
                          Request Id prefix format
                          <span className="required">*</span>
                        </Label>
                        <InputText
                          className={`inputField ${categoryConfigStyles.input}`}
                          value={requestInput?.format}
                          placeholder="Only alphabets allowed"
                          onChange={(e) => {
                            const onlyText = e.target.value
                              .replace(/[0-9]/g, "")
                              .toUpperCase();
                            setRequestFormatInput({
                              ...requestInput,
                              format: onlyText,
                            });
                          }}
                          disabled={actionsBooleans.isView}
                        />
                        {validateError && !requestInput?.format && (
                          <div>
                            <span className="errorMsg">
                              {validateError?.requestInput}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={`${categoryConfigStyles.inputChildDiv}`}>
                        <Label className={`${categoryConfigStyles.label}`}>
                          Number of digits_RequestId
                          <span className="required">*</span>
                        </Label>

                        <InputText
                          className={`inputField ${categoryConfigStyles.input}`}
                          value={requestInput?.digit}
                          placeholder="Enter number of digits (e.g., 5)"
                          onChange={(e) => {
                            const onlyNumbers = e.target.value.replace(
                              /\D/g,
                              ""
                            );
                            const numberValue = Number(onlyNumbers);
                            if (numberValue >= 1 && numberValue <= 10) {
                              setRequestFormatInput({
                                ...requestInput,
                                digit: onlyNumbers,
                              });
                            } else if (onlyNumbers === "") {
                              setRequestFormatInput({
                                ...requestInput,
                                digit: "",
                              });
                            }
                          }}
                          disabled={actionsBooleans.isView}
                        />
                        {validateError && !requestInput?.digit && (
                          <div>
                            <span className="errorMsg">
                              {validateError?.digit}
                            </span>
                          </div>
                        )}
                        <div className={categoryConfigStyles.labelNote}>
                          <span>
                            {requestInput?.format && requestInput?.digit ? (
                              <small style={{ fontSize: "10px" }}>
                                {`Note : Request Id Format will be like: ${
                                  requestInput.format
                                }-${String(1).padStart(
                                  Number(requestInput.digit),
                                  "0"
                                )}`}
                              </small>
                            ) : (
                              ""
                            )}
                          </span>
                        </div>
                      </div>

                      {!nextStageFromCategory.dynamicSectionWithField &&
                        !nextStageFromCategory.EmailTemplateSection &&
                        !actionsBooleans?.isEdit &&
                        !actionsBooleans?.isView && (
                          <div
                            className={`${categoryConfigStyles.inputChildDiv}`}
                          >
                            <>
                              <Label
                                className={`${categoryConfigStyles.label}`}
                              >
                                Approver Selection
                                <span className="required">*</span>
                              </Label>
                              <div
                                className={categoryConfigStyles.radioContainer}
                              >
                                <div className={categoryConfigStyles.radioDiv}>
                                  <Dropdown
                                    value={selectedApprover}
                                    options={Config?.approverOptions}
                                    onChange={(e) => {
                                      ApproverConfiguration(e);
                                    }}
                                    placeholder="Select approver type"
                                    className="inputField"
                                  />
                                </div>
                              </div>
                              <>
                                {validateError && !selectedApprover && (
                                  <div>
                                    <span className="errorMsg">
                                      {validateError?.approversSelected}
                                    </span>
                                  </div>
                                )}
                              </>
                            </>
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              ""
            )}

            <div
              className={`${
                nextStageFromCategory.ApproverSection
                  ? categoryConfigStyles.radioContainerChild
                  : categoryConfigStyles?.notApproverSection
              }`}
            >
              <div>
                {(selectedApprover !== "" ||
                  actionsBooleans?.isView ||
                  actionsBooleans?.isEdit) &&
                  activeStep == 0 && (
                    <span className="overAllHeading">
                      Approvers Information
                    </span>
                  )}
                <div
                  className={
                    categoryConfigStyles?.ExistingCustomApproverContainer
                  }
                >
                  {selectedApprover === "existing" &&
                  nextStageFromCategory.ApproverSection &&
                  activeStep == 0 ? (
                    <ExistingApprover
                      setApproverSignatureDetails={setApproverSignatureDetails}
                      approverSignatureDetails={approverSignatureDetails}
                      setFinalSubmit={setFinalSubmit}
                      actionBooleans={actionsBooleans}
                      setExisitingApproverSideBarVisible={
                        setCategorySideBarVisible
                      }
                      category={categoryInputs}
                    />
                  ) : (selectedApprover === "custom" &&
                      nextStageFromCategory.ApproverSection &&
                      activeStep == 0) ||
                    (actionsBooleans?.isEdit &&
                      nextStageFromCategory.ApproverSection &&
                      activeStep == 0) ||
                    (actionsBooleans?.isView &&
                      nextStageFromCategory.ApproverSection &&
                      activeStep == 0) ? (
                    <CustomApprover
                      setApproverSignatureDetails={setApproverSignatureDetails}
                      approverSignatureDetails={approverSignatureDetails}
                      categoryClickingID={selectedCategoryId}
                      runValidationFunction={childRef}
                      actionBooleans={actionsBooleans}
                      category={categoryInputs}
                      setFinalSubmit={setFinalSubmit}
                      context={context}
                      setCustomApproverSideBarVisible={
                        setCategorySideBarVisible
                      }
                    />
                  ) : (
                    <></>
                  )}
                </div>

                {nextStageFromCategory.dynamicSectionWithField &&
                activeStep == 1 ? (
                  <DynamicSectionWithField
                    finalSubmit={finalSubmit}
                    categoryDraft={categoryDraft}
                    getCategoryConfigDetails={getCategoryConfigDetails}
                    context={context}
                    setFinalSubmit={setFinalSubmit}
                    previous={() => setActiveStep(0)}
                    next={() => setActiveStep(2)}
                    categoryClickingID={selectedCategoryId}
                    actionBooleans={actionsBooleans}
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                    setNextStageFromCategory={setNextStageFromCategory}
                    setSelectedApprover={setSelectedApprover}
                    setDynamicSectionWithFieldSideBarVisible={
                      setCategorySideBarVisible
                    }
                  />
                ) : nextStageFromCategory.EmailTemplateSection &&
                  activeStep === 2 ? (
                  <EmailContainer
                    categoryDraft={categoryDraft}
                    setFinalSubmit={setFinalSubmit}
                    previous={() => setActiveStep(1)}
                    setActiveStep={setActiveStep}
                    activeStep={activeStep}
                    actionBooleans={actionsBooleans}
                    categoryClickingID={selectedCategoryId}
                    getCategoryConfigDetails={getCategoryConfigDetails}
                    finalSubmit={finalSubmit}
                    setNextStageFromCategory={setNextStageFromCategory}
                    setSelectedApprover={setSelectedApprover}
                    setCategoryInputs={setCategoryInputs}
                    setEmailContainerFieldSideBarVisible={
                      setCategorySideBarVisible
                    }
                  />
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>

          {nextStageFromCategory.ApproverSection ? (
            <div className={`${categoryConfigStyles.FlowSideBarButtons}`}>
              <Button
                icon="pi pi-times"
                label="Cancel"
                onClick={() => {
                  setCategorySideBarVisible(false);
                  setActiveStep(0);
                }}
                className="customCancelButton"
              />
              <Button
                icon="pi pi-angle-double-right"
                label="Next"
                className="customSubmitButton"
                onClick={() => {
                  if (
                    actionsBooleans?.isEdit ||
                    (actionsBooleans?.isEdit === false &&
                      actionsBooleans?.isView === false)
                  ) {
                    finalValidation(false);
                  } else {
                    setNextStageFromCategory(
                      (prev: INextStageFromCategorySideBar) => ({
                        ...prev,
                        dynamicSectionWithField: true,
                        ApproverSection: false,
                      })
                    );
                    setActiveStep(1);
                  }
                }}
              />
            </div>
          ) : (
            ""
          )}
        </div>
      </>
    );
  };

  useEffect(() => {
    setFinalSubmit((prev: IFinalSubmitDetails) => ({
      ...prev,
      categoryConfig: {
        ...prev.categoryConfig,
        category: categoryInputs,
        requestIdFormat: requestInput?.format,
        requestIdDigit: requestInput?.digit,
        isApproverSignRequired: approverSignatureDetails?.isMandatory,
        viewApproverSignStages: approverSignatureDetails?.ViewStages,
      },
    }));
  }, [categoryInputs, requestInput, approverSignatureDetails]);

  useEffect(() => {
    getCategoryConfigDetails();
    setValidateError({
      categoryName: "",
      approversSelected: "",
      requestInput: "",
      digit: "",
      signatureShowStages: "",
    });
    //Handle ReLoad Browser then clear session Storage:
    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!ApprovalConfigSideBarVisible) {
      setValidateError({
        categoryName: "",
        approversSelected: "",
        requestInput: "",
        digit: "",
        signatureShowStages: "",
      });
      setFinalSubmit({ ...Config.finalSubmitDetails });
      sessionStorage.clear();
      setSelectedApprover("");
      setNextStageFromCategory({
        ...Config.NextStageFromCategorySideBar,
      });
      setCategoryInputs("");
      setApproverSignatureDetails({ ...Config.approverSignatureFieldConfig });
      setApprovalSignStage([]);
      setRequestFormatInput({
        ...Config.requestIdFormatWithDigit,
      });
      setSelectedCategoryId(null);
      setActionsBooleans({ ...Config.InitialActionsBooleans });
      setActiveStep(0);
    }
  }, [ApprovalConfigSideBarVisible]);

  useEffect(() => {
    setCategorySideBarContent((prev: IRightSideBarContents) => ({
      ...prev,
      categoryConfigContent: categoryConfigSideBarContents(),
    }));
  }, [
    categoryInputs,
    selectedApprover,
    nextStageFromCategory,
    selectedCategoryId,
    validateError,
    actionsBooleans,
    requestInput,
    approverSignatureDetails,
    approvalSignStage,
    activeStep,
  ]);
  useEffect(() => {
    getApprovalStageCount();
  }, [finalSubmit]);
  useEffect(() => {
    getCategoryFunction();
  }, [categoryDetails]);
  return (
    <>
      <Toast ref={toast} />
      {showLoader ? (
        <Loader />
      ) : (
        <>
          <div className="customDataTableCardContainer">
            <div
              style={{
                borderBottom: "none",
                paddingBottom: "0px",
                marginBottom: "25px",
              }}
              className="profile_header_content"
            >
              <div>
                <span>Category workflows</span>
                <p>
                  Configure WorkFlows and define their structure for request
                  management
                </p>
              </div>
            </div>
            <div className="allRecords">
              <span style={{ fontFamily: "interSemiBold" }}>
                All categories
              </span>
            </div>
            <div className="dashboardDataTable">
              <DataTable
                value={categoryDetails}
                paginator
                rows={3}
                className="custom-card-table"
                emptyMessage={
                  <p className="NoDatas" style={{ textAlign: "center" }}>
                    No Records Found
                  </p>
                }
              >
                <Column
                  body={(rowData) => (
                    <div className="requestCard">
                      <div className="requestCardHeader">
                        <div className="requestId">
                          <h3 className="requestIdTitle">
                            <BiCategory style={{ fontSize: "18px" }} />
                            {rowData.category}
                          </h3>
                          {/* <span>{renderStatusColumn(rowData)}</span> */}
                        </div>
                      </div>
                      <div className="requestCardBody">
                        <div className="requestIdDetails">
                          <p className="requestIdpara">
                            Request Id Format - {rowData.requestIdFormat}
                          </p>
                        </div>
                        {renderActionColumn(rowData)}
                      </div>
                    </div>
                  )}
                />
              </DataTable>
            </div>
          </div>
        </>
      )}
      <Dialog
        className="modal-template confirmation"
        draggable={false}
        blockScroll={false}
        resizable={false}
        visible={delModal.isOpen}
        style={{ width: "20rem" }}
        onHide={() => {
          setDelModal({ isOpen: false, id: null });
        }}
      >
        <div className="modal-container">
          <div className="modalIconContainer">
            <RiDeleteBinLine />
          </div>
          <div className="modal-content">
            <div>
              <div className="modal-header">
                <h4>Confirmation</h4>
              </div>
              <p>Are you sure, you want to delete this category?</p>
            </div>
          </div>
          <div className="modal-btn-section">
            <Button
              label="No"
              className={`cancel-btn`}
              onClick={() => {
                setDelModal({ isOpen: false, id: null });
              }}
            />
            <Button
              className={`submit-btn`}
              label="Yes"
              onClick={() => isDeleteCategory()}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default CategoryConfig;

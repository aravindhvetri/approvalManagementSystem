//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//Common Service Imports:
import SPServices from "../../../../../CommonServices/SPServices";
import { Config } from "../../../../../CommonServices/Config";
import {
  IActionBooleans,
  IApproverSignatureFeildConfig,
  ICategoryDetails,
  IFinalSubmitDetails,
  INextStageFromCategorySideBar,
  IRequestIdFormatWithDigit,
  IRightSideBarContents,
} from "../../../../../CommonServices/interface";
import {
  ActionsMenu,
  toastNotify,
} from "../../../../../CommonServices/CommonTemplates";
//Styles Imports:
import "../../../../../External/style.css";
import categoryConfigStyles from "./CategoryConfig.module.scss";
//primeReact Imports:
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Label } from "office-ui-fabric-react";
import ExistingApprover from "./ExistingApprover";
import CustomApprover from "./CustomApprover";
import { Button } from "primereact/button";
import { Steps } from "primereact/steps";
//Component Imports:
import DynamicSectionWithField from "./DynamicSectionWithField/DynamicSectionWithField";
import EmailContainer from "./EmailTemplate/EmailContainer";
import Loader from "../../Loader/Loader";
import { set } from "@microsoft/sp-lodash-subset";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";

const CategoryConfig = ({
  context,
  getCategoryFunction,
  selectedCategory,
  setCategorySideBarContent,
  ApprovalConfigSideBarVisible,
  setCategorySideBarVisible,
}) => {
  //state variables:
  const stepItems = [
    { label: "Category Config" },
    { label: "Dynamic Fields" },
    { label: "Email Config" },
  ];
  const [activeStep, setActiveStep] = useState(0);
  console.log("activeStep", activeStep);
  const toast = useRef<Toast>(null);
  const [categoryDetails, setCategoryDetails] = useState<ICategoryDetails[]>(
    []
  );
  const [categoryInputs, setCategoryInputs] = useState<string>("");
  const [requestInput, setRequestFormatInput] =
    useState<IRequestIdFormatWithDigit>({
      ...Config.requestIdFormatWithDigit,
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
  console.log("finalSubmit", finalSubmit);
  console.log("validateError", validateError);
  console.log("approvalSignStage", approvalSignStage);

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
      command: () => isDeleteCategory(rowData?.id),
    },
  ];

  //Handle View and Edit Actions:
  const handleActionClick = async (rowData: ICategoryDetails) => {
    console.log(rowData, "rowData");
    // setShowLoader(true);
    // await new Promise((resolve) => setTimeout(resolve, 100));
    setCategoryInputs(rowData?.category);
    setRequestFormatInput((prev: IRequestIdFormatWithDigit) => ({
      ...prev,
      format: rowData?.requestIdFormat,
      digit: rowData?.requestIdDigit,
    }));
    setApproverSignatureDetails((prev: IApproverSignatureFeildConfig) => ({
      ...prev,
      ViewStages: rowData?.viewApproverSignStages,
      isMandatory: rowData?.isApproverSignRequired,
    }));
    await setSelectedCategoryId(rowData?.id);
    setCategorySideBarVisible(true);
    // setShowLoader(false);
  };

  //Render Action Column:
  const renderActionColumn = (rowData: ICategoryDetails) => {
    const menuModel = actionsWithIcons(rowData);
    return <ActionsMenu items={menuModel} />;
  };

  //IsDelete update for categroy
  const isDeleteCategory = (itemID: number) => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames.CategoryConfig,
      ID: itemID,
      RequestJSON: {
        IsDelete: true,
      },
    }).then((res) => {
      getCategoryConfigDetails();
    });
  };

  const finalValidation = () => {
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
    if (approverSignatureDetails?.ViewStages.length === 0) {
      validateError.signatureShowStages =
        "Atleast one stage is required to shows signature field";
      isValid = false;
    } else {
      validateError.signatureShowStages = "";
    }
    if (!actionsBooleans?.isEdit && !actionsBooleans?.isView) {
      // Approver validation
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
                }),
              life: 3000,
            });
            isValid = false;
          } else {
            validateError.approversSelected = "";
          }
        }

        if (selectedApprover === "custom") {
          const approvalFlowDetails = sessionStorage.getItem(
            "approvalFlowDetails"
          );
          if (!approvalFlowDetails) {
            validateError.approversSelected =
              "Please configure custom approver flow";
            isValid = false;
          } else {
            try {
              const parsedDetails = JSON.parse(approvalFlowDetails);
              const { apprvalFlowName, totalStages, rejectionFlow, stages } =
                parsedDetails;
              if (!apprvalFlowName || !rejectionFlow) {
                // validateError.approversSelected =
                //   "Incomplete custom approver configuration";
                toast.current.show({
                  severity: "warn",
                  summary: "Warning",
                  content: (prop) =>
                    toastNotify({
                      iconName: "pi-exclamation-triangle",
                      ClsName: "toast-imgcontainer-warning",
                      type: "Warning",
                      msg: "Incomplete custom approver configuration",
                    }),
                  life: 3000,
                });
                isValid = false;
              } else if (
                !totalStages ||
                stages.length === 0 ||
                stages.some(
                  (stage: any) =>
                    !stage.approvalProcess || stage.approver.length === 0
                )
              ) {
                // validateError.approversSelected =
                //   "No stages found in custom approver configuration";
                toast.current.show({
                  severity: "warn",
                  summary: "Warning",
                  content: (prop) =>
                    toastNotify({
                      iconName: "pi-exclamation-triangle",
                      ClsName: "toast-imgcontainer-warning",
                      type: "Warning",
                      msg: "Each stage must include both an approver and a process. Please complete the custom approver configuration.",
                    }),
                  life: 3000,
                });
                isValid = false;
              } else {
                validateError.approversSelected = "";
              }
            } catch (err) {
              validateError.approversSelected =
                "Error reading custom approver configuration";
              isValid = false;
            }
          }
        }
      }
    }
    // Update the validation error state
    setValidateError({ ...validateError });

    // If everything is valid, move to next section
    if (isValid) {
      setNextStageFromCategory((prev: INextStageFromCategorySideBar) => ({
        ...prev,
        dynamicSectionWithField: true,
        ApproverSection: false,
      }));
      next();
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

  //CategoryRightSideBar Contents:
  const categoryConfigSideBarContents = () => {
    return (
      <>
        <Steps
          model={stepItems}
          activeIndex={activeStep}
          onSelect={(e) => setActiveStep(e.index)}
          readOnly={true}
          style={{ paddingBottom: "30px" }}
        />
        <div>
          {nextStageFromCategory.dynamicSectionWithField ||
          nextStageFromCategory.EmailTemplateSection ? (
            <></>
          ) : (
            <>
              <div className={`${categoryConfigStyles.inputContainer}`}></div>
              <div className={`${categoryConfigStyles.inputDiv}`}>
                <div className={`${categoryConfigStyles.inputChildDiv}`}>
                  <Label className={`${categoryConfigStyles.label}`}>
                    Category<span className="required">*</span>
                  </Label>
                  <InputText
                    className={`${categoryConfigStyles.input}`}
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
                    Request Id prefix format<span className="required">*</span>
                  </Label>
                  <InputText
                    className={`${categoryConfigStyles.input}`}
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
                  {requestInput?.format && requestInput?.digit ? (
                    <small
                      style={{ fontSize: "10px" }}
                      className={`${categoryConfigStyles.label}`}
                    >
                      {`Note: Format will be like: ${
                        requestInput.format
                      }-${String(1).padStart(Number(requestInput.digit), "0")}`}
                    </small>
                  ) : (
                    ""
                  )}

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
                    className={`${categoryConfigStyles.input}`}
                    value={requestInput?.digit}
                    placeholder="Enter number of digits (e.g., 5)"
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/\D/g, "");
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
                      <span className="errorMsg">{validateError?.digit}</span>
                    </div>
                  )}
                </div>
              </div>
              {actionsBooleans?.isEdit == false &&
              actionsBooleans?.isView == false ? (
                <div className={`${categoryConfigStyles.radioContainer}`}>
                  <div className={`${categoryConfigStyles.radioDiv}`}>
                    <RadioButton
                      inputId="existing"
                      name="approver"
                      value="existing"
                      onChange={(e) => {
                        setValidateError((prev) => ({
                          ...prev,
                          signatureShowStages: "",
                        }));
                        setFinalSubmit((prev: IFinalSubmitDetails) => ({
                          ...prev,
                          categoryConfig: {
                            ...prev.categoryConfig,
                            customApprover: {},
                          },
                        }));
                        setApproverSignatureDetails({
                          ...Config.approverSignatureFieldConfig,
                        });
                        setApprovalSignStage([]);
                        sessionStorage.removeItem("approvalFlowDetails");
                        setSelectedApprover(e?.value);
                      }}
                      checked={selectedApprover === "existing"}
                    />
                    <label
                      className={`${categoryConfigStyles.radioDivLabel}`}
                      htmlFor="existing"
                    >
                      Existing approver
                    </label>
                  </div>
                  <div className={`${categoryConfigStyles.radioDiv}`}>
                    <RadioButton
                      inputId="custom"
                      name="approver"
                      value="custom"
                      onChange={(e) => {
                        setValidateError((prev) => ({
                          ...prev,
                          signatureShowStages: "",
                        }));
                        setFinalSubmit((prev: IFinalSubmitDetails) => ({
                          ...prev,
                          categoryConfig: {
                            ...prev.categoryConfig,
                            ExistingApprover: null,
                          },
                        }));
                        setApproverSignatureDetails({
                          ...Config.approverSignatureFieldConfig,
                        });
                        setApprovalSignStage([]);
                        sessionStorage.removeItem("selectedFlow");
                        sessionStorage.removeItem("selectedFlowID");
                        setSelectedApprover(e?.value);
                      }}
                      checked={selectedApprover === "custom"}
                    />
                    <label
                      className={`${categoryConfigStyles.radioDivLabel}`}
                      htmlFor="custom"
                    >
                      Custom approver
                    </label>
                  </div>
                </div>
              ) : (
                ""
              )}
            </>
          )}
          <div>
            {selectedApprover === "existing" &&
            nextStageFromCategory.ApproverSection &&
            activeStep == 0 ? (
              <ExistingApprover
                setApproverSignatureDetails={setApproverSignatureDetails}
                setFinalSubmit={setFinalSubmit}
                setExisitingApproverSideBarVisible={setCategorySideBarVisible}
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
                categoryClickingID={selectedCategoryId}
                actionBooleans={actionsBooleans}
                category={categoryInputs}
                setFinalSubmit={setFinalSubmit}
                context={context}
                setCustomApproverSideBarVisible={setCategorySideBarVisible}
              />
            ) : (
              <></>
            )}
            {nextStageFromCategory.dynamicSectionWithField &&
            activeStep == 1 ? (
              <DynamicSectionWithField
                context={context}
                setFinalSubmit={setFinalSubmit}
                previous={() => setActiveStep(0)}
                next={() => setActiveStep(2)}
                categoryClickingID={selectedCategoryId}
                actionBooleans={actionsBooleans}
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
                getCategoryFunction={getCategoryFunction}
                setFinalSubmit={setFinalSubmit}
                previous={() => setActiveStep(1)}
                setActiveStep={setActiveStep}
                actionBooleans={actionsBooleans}
                categoryClickingID={selectedCategoryId}
                getCategoryConfigDetails={getCategoryConfigDetails}
                finalSubmit={finalSubmit}
                setNextStageFromCategory={setNextStageFromCategory}
                setSelectedApprover={setSelectedApprover}
                setCategoryInputs={setCategoryInputs}
                setEmailContainerFieldSideBarVisible={setCategorySideBarVisible}
              />
            ) : (
              <></>
            )}
          </div>
          {validateError && !selectedApprover && (
            <div>
              <span className="errorMsg">
                {validateError?.approversSelected}
              </span>
            </div>
          )}
          {!(
            nextStageFromCategory.dynamicSectionWithField ||
            nextStageFromCategory.EmailTemplateSection
          ) &&
            approvalSignStage.length > 0 && (
              <div
                className={`${categoryConfigStyles.approverSignatureDetailContainer}`}
              >
                <div style={{ width: "32%" }}>
                  <Label className={`${categoryConfigStyles.label}`}>
                    Is Approver Signature Mandatory?
                  </Label>
                  <Checkbox
                    onChange={(e) => {
                      setApproverSignatureDetails(
                        (prev: IApproverSignatureFeildConfig) => ({
                          ...prev,
                          isMandatory: e.checked,
                        })
                      );
                    }}
                    checked={approverSignatureDetails.isMandatory}
                    disabled={actionsBooleans.isView}
                  ></Checkbox>
                </div>
                <div style={{ width: "32%" }}>
                  <Label className={`${categoryConfigStyles.label}`}>
                    Stages signature field shows on
                    <span className="required">*</span>
                  </Label>
                  <MultiSelect
                    onChange={(e) => {
                      setApproverSignatureDetails(
                        (prev: IApproverSignatureFeildConfig) => ({
                          ...prev,
                          ViewStages: e.value,
                        })
                      );
                      console.log("Cchk", e);
                    }}
                    value={approverSignatureDetails?.ViewStages}
                    options={approvalSignStage}
                    optionLabel="value"
                    disabled={actionsBooleans.isView}
                  />
                  {validateError &&
                    approverSignatureDetails?.ViewStages.length === 0 && (
                      <div>
                        <span className="errorMsg">
                          {validateError?.signatureShowStages}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}
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

              {/* <Button
                icon="pi pi-angle-double-right"
                label="Next"
                className="customSubmitButton"
                onClick={() => {
                  actionsBooleans?.isEdit ||
                  (actionsBooleans?.isEdit === false &&
                    actionsBooleans?.isView === false)
                    ? finalValidation()
                    : setNextStageFromCategory(
                        (prev: INextStageFromCategorySideBar) => ({
                          ...prev,
                          dynamicSectionWithField: true,
                          ApproverSection: false,
                        })
                      );
                }}
              /> */}
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
                    finalValidation();
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
  return (
    <>
      <Toast ref={toast} />
      {showLoader ? (
        <Loader />
      ) : (
        <>
          <div className="customDataTableContainer">
            <DataTable
              globalFilter={selectedCategory?.name}
              paginator
              rows={5}
              value={categoryDetails}
              tableStyle={{ minWidth: "50rem" }}
              emptyMessage={
                <>
                  <p style={{ textAlign: "center" }}>No Records Found</p>
                </>
              }
            >
              <Column
                style={{ width: "80%" }}
                field="category"
                header="Category"
              ></Column>
              <Column
                style={{ width: "20%" }}
                field="Action"
                body={renderActionColumn}
              ></Column>
            </DataTable>
          </div>
        </>
      )}
    </>
  );
};

export default CategoryConfig;

//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//Common Service Imports:
import SPServices from "../../../../../CommonServices/SPServices";
import { Config } from "../../../../../CommonServices/Config";
import {
  IActionBooleans,
  ICategoryDetails,
  IFinalSubmitDetails,
  INextStageFromCategorySideBar,
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
//Component Imports:
import DynamicSectionWithField from "./DynamicSectionWithField/DynamicSectionWithField";
import EmailContainer from "./EmailTemplate/EmailContainer";
import Loader from "../../Loader/Loader";
import { set } from "@microsoft/sp-lodash-subset";

const CategoryConfig = ({
  context,
  getCategoryFunction,
  selectedCategory,
  setCategorySideBarContent,
  ApprovalConfigSideBarVisible,
  setCategorySideBarVisible,
}) => {
  //state variables:
  const toast = useRef<Toast>(null);
  const [categoryDetails, setCategoryDetails] = useState<ICategoryDetails[]>(
    []
  );
  const [categoryInputs, setCategoryInputs] = useState<string>("");
  const [requestInput, setRequestFormatInput] = useState<string>("");
  const [actionsBooleans, setActionsBooleans] = useState<IActionBooleans>({
    ...Config.InitialActionsBooleans,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedApprover, setSelectedApprover] = useState<string>("");
  console.log("selectedCategory", selectedCategory);
  const [nextStageFromCategory, setNextStageFromCategory] =
    useState<INextStageFromCategorySideBar>({
      ...Config.NextStageFromCategorySideBar,
    });
  const [validateError, setValidateError] = useState({
    categoryName: "",
    approversSelected: "",
    requestInput: "",
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
    // setShowLoader(true);
    // await new Promise((resolve) => setTimeout(resolve, 100));
    setCategoryInputs(rowData?.category);
    setRequestFormatInput(rowData?.requestIdFormat);
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
    if (requestInput === "") {
      validateError.requestInput = "Request Id format is mandatory";
      isValid = false;
    } else {
      validateError.requestInput = "";
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
    }
  };

  //CategoryRightSideBar Contents:
  const categoryConfigSideBarContents = () => {
    return (
      <>
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
                    value={requestInput}
                    placeholder="Only alphabets allowed"
                    onChange={(e) => {
                      const onlyText = e.target.value
                        .replace(/[0-9]/g, "")
                        .toUpperCase();
                      setRequestFormatInput(onlyText);
                    }}
                    disabled={actionsBooleans.isView}
                  />
                  {requestInput ? (
                    <small
                      style={{ fontSize: "10px" }}
                      className={`${categoryConfigStyles.label}`}
                    >
                      {`Note: Format will be like: ${requestInput}-XXXXX`}
                    </small>
                  ) : (
                    ""
                  )}

                  {validateError && !requestInput && (
                    <div>
                      <span className="errorMsg">
                        {validateError?.requestInput}
                      </span>
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
            nextStageFromCategory.ApproverSection ? (
              <ExistingApprover
                setFinalSubmit={setFinalSubmit}
                setExisitingApproverSideBarVisible={setCategorySideBarVisible}
                category={categoryInputs}
              />
            ) : (selectedApprover === "custom" &&
                nextStageFromCategory.ApproverSection) ||
              (actionsBooleans?.isEdit &&
                nextStageFromCategory.ApproverSection) ||
              (actionsBooleans?.isView &&
                nextStageFromCategory.ApproverSection) ? (
              <CustomApprover
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
            {nextStageFromCategory.dynamicSectionWithField ? (
              <DynamicSectionWithField
                context={context}
                setFinalSubmit={setFinalSubmit}
                categoryClickingID={selectedCategoryId}
                actionBooleans={actionsBooleans}
                setNextStageFromCategory={setNextStageFromCategory}
                setSelectedApprover={setSelectedApprover}
                setDynamicSectionWithFieldSideBarVisible={
                  setCategorySideBarVisible
                }
              />
            ) : nextStageFromCategory.EmailTemplateSection ? (
              <EmailContainer
                getCategoryFunction={getCategoryFunction}
                setFinalSubmit={setFinalSubmit}
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

          {nextStageFromCategory.ApproverSection ? (
            <div className={`${categoryConfigStyles.FlowSideBarButtons}`}>
              <Button
                icon="pi pi-times"
                label="Cancel"
                onClick={() => {
                  setCategorySideBarVisible(false);
                }}
                className="customCancelButton"
              />

              <Button
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
        requestIdFormat: requestInput,
      },
    }));
  }, [categoryInputs, requestInput]);

  useEffect(() => {
    getCategoryConfigDetails();
    setValidateError({
      categoryName: "",
      approversSelected: "",
      requestInput: "",
    });
  }, []);

  useEffect(() => {
    if (!ApprovalConfigSideBarVisible) {
      setValidateError({
        categoryName: "",
        approversSelected: "",
        requestInput: "",
      });
      sessionStorage.clear();
      setSelectedApprover("");
      setNextStageFromCategory({
        ...Config.NextStageFromCategorySideBar,
      });
      setCategoryInputs("");
      setRequestFormatInput("");
      setSelectedCategoryId(null);
      setActionsBooleans({ ...Config.InitialActionsBooleans });
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
  ]);

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

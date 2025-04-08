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
import { ActionsMenu } from "../../../../../CommonServices/CommonTemplates";
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

const CategoryConfig = ({
  context,
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
  const [actionsBooleans, setActionsBooleans] = useState<IActionBooleans>({
    ...Config.InitialActionsBooleans,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedApprover, setSelectedApprover] = useState<string>("");
  const [nextStageFromCategory, setNextStageFromCategory] =
    useState<INextStageFromCategorySideBar>({
      ...Config.NextStageFromCategorySideBar,
    });
  const [validateError, setValidateError] = useState({
    categoryName: "",
    approversSelected: "",
  });
  const [finalSubmit, setFinalSubmit] = useState<IFinalSubmitDetails>({
    ...Config.finalSubmitDetails,
  });
<<<<<<<<< Temporary merge branch 1
  const [showLoader, setShowLoader] = useState<boolean>(true);
=========
  console.log("finalSubmit", finalSubmit);
  console.log("validateError", validateError);
>>>>>>>>> Temporary merge branch 2

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
            category: items?.Category,
            isDelete: items?.IsDelete,
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
      icon: "pi pi-pencil ",
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
      icon: "pi pi-trash",
      command: () => isDeleteCategory(rowData?.id),
    },
  ];

  //Handle View and Edit Actions:
  const handleActionClick = async (rowData: ICategoryDetails) => {
    // setShowLoader(true);
    // await new Promise((resolve) => setTimeout(resolve, 100));
    setCategoryInputs(rowData?.category);
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

  //Validations
  const finalValidation = () => {
    if (finalSubmit?.categoryConfig?.category === "") {
      debugger;
      validateError.categoryName = "Category name is mandatory";
      setValidateError({
        ...validateError,
      });
    } else if (
      finalSubmit?.categoryConfig.ExistingApprover === null &&
      finalSubmit?.categoryConfig.customApprover === null
    ) {
      validateError.categoryName = "";
      validateError.approversSelected =
        "Approval flow is mandatory for approval process";
      setValidateError({
        ...validateError,
      });
    }
    if (
      validateError?.categoryName === "" &&
      validateError?.approversSelected === ""
    ) {
      setValidateError({
        categoryName: "",
        approversSelected: "",
      });
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
              <div className={`${categoryConfigStyles.inputContainer}`}>
                <div style={{ paddingBottom: "10px" }}>
                  <Label className={`${categoryConfigStyles.label}`}>
                    Category<span className="required">*</span>
                  </Label>
                </div>
                <InputText
                  className={`${categoryConfigStyles.input}`}
                  value={categoryInputs}
                  disabled={actionsBooleans.isView}
                  placeholder="Enter Category"
                  onChange={(e) => setCategoryInputs(e.target.value)}
                />
                <div>
                  <span className="errorMsg">{validateError.categoryName}</span>
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
          <div>
            <span className="errorMsg">{validateError?.approversSelected}</span>
          </div>
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
                  finalValidation();
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
      },
    }));
  }, [categoryInputs]);
  useEffect(() => {
    getCategoryConfigDetails();
    setValidateError({
      categoryName: "",
      approversSelected: "",
    });
  }, []);

  useEffect(() => {
    if (!ApprovalConfigSideBarVisible) {
      sessionStorage.clear();
      setSelectedApprover("");
      setNextStageFromCategory({
        ...Config.NextStageFromCategorySideBar,
      });
      setCategoryInputs("");
      setSelectedCategoryId(null);
      setActionsBooleans({ ...Config.InitialActionsBooleans });
    }
  }, [ApprovalConfigSideBarVisible]);

  // useEffect(() => {
  //   setCategorySideBarContent((prev: IRightSideBarContents) => ({
  //     ...prev,
  //     categoryConfigContent: categoryConfigSideBarContents(),
  //   }));
  // }, [
  //   categoryInputs,
  //   selectedApprover,
  //   nextStageFromCategory,
  //   selectedCategoryId,
  //   actionsBooleans,
  // ]);
  useEffect(() => {
    if (!showLoader) {
      setCategorySideBarContent((prev: IRightSideBarContents) => ({
        ...prev,
        categoryConfigContent: categoryConfigSideBarContents(),
      }));
    }
  }, [
    categoryInputs,
    selectedApprover,
    nextStageFromCategory,
    selectedCategoryId,
    validateError,
    actionsBooleans,
    showLoader, // include this so it rerenders only after loader is false
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

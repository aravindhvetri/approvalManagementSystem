//Default Imports:
import * as React from "react";
import { useState, useEffect } from "react";
//CommonService Imports:
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import {
  IPeoplePickerDetails,
  IRightSideBarContents,
  ISectionColumnsConfig,
  IApprovalDetails,
  IApprovalStages,
  IApprovalHistoryDetails,
  IRequestHubDetails,
} from "../../../../CommonServices/interface";
//primeReact Imports:
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Label } from "office-ui-fabric-react";
import { classNames } from "primereact/utils";
//Styles Imports:
import dynamicFieldsStyles from "./RequestsFields.module.scss";
import "../../../../External/style.css";
import WorkflowActionButtons from "../WorkflowButtons/WorkflowActionButtons";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  peoplePickerTemplate,
  statusTemplate,
} from "../../../../CommonServices/CommonTemplates";
import { orderBy } from "lodash";
import { Dropdown } from "primereact/dropdown";

const RequestsFields = ({
  context,
  requestsDetails,
  setRequestsDetails,
  currentRecord,
  sideBarVisible,
  recordAction,
  navigateFrom,
  setRequestsDashBoardContent,
  setDynamicRequestsSideBarVisible,
}) => {
  const [dynamicFields, setDynamicFields] = useState<ISectionColumnsConfig[]>(
    []
  );
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [author, setAuthor] = useState<IPeoplePickerDetails>();
  const loginUser = context._pageContext._user.email;
  const [approvalDetails, setApprovalDetails] = useState<IApprovalDetails>({
    parentID: currentRecord.id,
    stage: currentRecord.approvalJson[0].Currentstage,
    approverEmail: loginUser,
    status: "",
    comments: "",
  });
  console.log("formData", formData);
  const [approvalHistoryDetails, setApprovalHistoryDetails] =
    useState<IApprovalHistoryDetails[]>();
  //CategorySectionConfig List
  const getCategorySectionConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.CategorySectionConfig,
      Select: "*,Category/Id",
      Expand: "Category",
      Orderby: "Modified",
      Orderbydecorasc: false,
      Filter: [
        {
          FilterKey: "Category",
          Operator: "eq",
          FilterValue: currentRecord.CategoryId.toString(),
        },
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res: any) => {
        res.forEach((item: any) => {
          getSectionColumnsConfigDetails(item?.SectionName, item?.ID);
        });
      })
      .catch((err) => {
        console.log(err, "getCategorySectionConfigDetails");
      });
  };
  //SectionColumnsConfig List
  const getSectionColumnsConfigDetails = (
    secionName: string,
    secionID: number
  ) => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.SectionColumnsConfig,
      Select: "*,ParentSection/Id",
      Expand: "ParentSection",
      Orderby: "Modified",
      Orderbydecorasc: false,
      Filter: [
        {
          FilterKey: "ParentSection",
          Operator: "eq",
          FilterValue: secionID.toString(),
        },
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res) => {
        const tempArr: ISectionColumnsConfig[] = [];
        res.forEach((item: any) => {
          tempArr.push({
            id: item?.ID,
            sectionName: secionName,
            columnName: item?.ColumnInternalName,
            columnDisplayName: item?.ColumnExternalName,
            columnType: item?.ColumnType,
            isRequired: item?.IsRequired,
            viewStage: JSON.parse(item?.ViewStage),
            choices:
              (JSON.parse(item?.ChoiceValues) &&
                JSON.parse(item?.ChoiceValues)[0].Options) ||
              [],
          });
        });
        setDynamicFields((prevFields) => [...prevFields, ...tempArr]);
      })
      .catch((e) => {
        console.log(e, "getSectionColumnsConfig err");
      });
  };

  //Get RequestHub details
  const getRequestHubDetails = () => {
    SPServices.SPReadItemUsingId({
      Listname: Config.ListNames.RequestsHub,
      Select: "*,Author/ID,Author/Title,Author/EMail",
      Expand: "Author",
      SelectedId: currentRecord.id,
    })
      .then((item: any) => {
        const tempArr = {};
        dynamicFields.map((e) => (tempArr[e.columnName] = item[e.columnName]));
        setFormData(tempArr);
        setAuthor({
          id: item.Author.ID,
          name: item.Author.Title,
          email: item.Author.EMail,
        });
      })
      .catch((e) => {
        console.log("Get Current Record from RequestHup Details error", e);
      });
  };

  //Get Approval History
  const getApprovalHistory = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.ApprovalHistory,
      Select: "*,ParentID/Id,Approver/Title,Approver/EMail,Approver/Id",
      Expand: "ParentID,Approver",
      Filter: [
        {
          FilterKey: "ParentIDId",
          Operator: "eq",
          FilterValue: currentRecord.id.toString(),
        },
      ],
    })
      .then((res) => {
        const tempArr = [];
        res?.forEach((item: any) => {
          tempArr.push({
            createdDate: item?.Created,
            itemID: item?.ID,
            stage: item?.Stage,
            approver: {
              id: item?.Approver?.Id,
              name: item?.Approver?.Title,
              email: item?.Approver?.EMail,
            },
            status: item?.Status,
            comments: item?.Comments,
          });
        });
        setApprovalHistoryDetails(tempArr);
      })
      .catch((e) => console.log("getApprovalHistory errror", e));
  };
  //Render Status Column:
  const renderStatusColumn = (rowData: IApprovalHistoryDetails) => {
    return <div>{statusTemplate(rowData?.status)}</div>;
  };
  //Render Comments Column:
  const renderCommentsColumn = (rowData: IApprovalHistoryDetails) => {
    return (
      <div title={rowData?.comments}>
        {rowData?.comments.length > 100
          ? `${rowData?.comments.substring(0, 100)}...`
          : rowData?.comments}
      </div>
    );
  };
  //Set Approval Details
  const getApprovalDetails = async (columnName, value) => {
    let data = { ...approvalDetails };
    data[`${columnName}`] = value;
    await setApprovalDetails({ ...data });
  };

  //handleInputChange
  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    dynamicFields.forEach((field) => {
      if (field.isRequired && !formData[field.columnName]?.trim()) {
        newErrors[field.columnName] = `${field.columnDisplayName} is required.`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //Show columns based on view stage
  const showColumnsByStage = (field) => {
    if (
      (navigateFrom === "MyApproval" &&
        currentRecord?.approvalJson[0]?.stages
          .filter((stage) => field?.viewStage[0]?.Stage.includes(stage.stage))
          .some((stage) =>
            stage.approvers.some((e) => e.email === loginUser)
          )) ||
      navigateFrom === "MyRequest" ||
      navigateFrom === "AllRequest"
    ) {
      return true;
    } else {
      return false;
    }
  };

  //DynamicRequestFieldsSideBarContent Return Function:
  const DynamicRequestsFieldsSideBarContent = () => {
    return (
      <>
        <div className={dynamicFieldsStyles.formContainer}>
          <Label className={dynamicFieldsStyles.labelHeader}>
            Request details
          </Label>
          <div className={dynamicFieldsStyles.singlelineFields}>
            {dynamicFields
              .filter((f) => f.columnType === "Singleline")
              .map(
                (field) =>
                  showColumnsByStage(field) && (
                    <div
                      key={field.id}
                      className={dynamicFieldsStyles.inputField}
                    >
                      <Label className={dynamicFieldsStyles.label}>
                        {field.columnDisplayName}
                        {field?.isRequired && (
                          <span className="required">*</span>
                        )}
                      </Label>
                      <InputText
                        disabled={
                          !(
                            recordAction === "Edit" &&
                            author?.email === loginUser &&
                            navigateFrom === "MyRequest"
                          )
                        }
                        id={field.columnName}
                        value={formData[field.columnName] || ""}
                        onChange={(e) =>
                          handleInputChange(field.columnName, e.target.value)
                        }
                      />
                      {errors[field.columnName] && (
                        <span className={dynamicFieldsStyles.errorMsg}>
                          {errors[field.columnName]}
                        </span>
                      )}
                    </div>
                  )
              )}
          </div>
          <div className={dynamicFieldsStyles.singlelineFields}>
            {dynamicFields
              .filter((f) => f.columnType === "Choice")
              .map(
                (field) =>
                  showColumnsByStage(field) && (
                    <div
                      key={field.id}
                      className={dynamicFieldsStyles.inputField}
                    >
                      <Label className={dynamicFieldsStyles.label}>
                        {field.columnDisplayName}{" "}
                        {field?.isRequired && (
                          <span className="required">*</span>
                        )}
                      </Label>
                      <Dropdown
                        value={field?.choices.find(
                          (e) => e === formData[field.columnName]
                        )}
                        showClear
                        disabled={
                          !(
                            recordAction === "Edit" &&
                            author?.email === loginUser &&
                            navigateFrom === "MyRequest"
                          )
                        }
                        options={field?.choices}
                        onChange={(e) => {
                          handleInputChange(field.columnName, e.value);
                        }}
                        filter
                        placeholder={field.columnName}
                        className="w-full md:w-14rem"
                      />

                      {errors[field.columnName] && (
                        <span className={dynamicFieldsStyles.errorMsg}>
                          {errors[field.columnName]}
                        </span>
                      )}
                    </div>
                  )
              )}
          </div>
          <div className={dynamicFieldsStyles.multilineFields}>
            {dynamicFields
              .filter((f) => f.columnType === "Multiline")
              .map(
                (field) =>
                  showColumnsByStage(field) && (
                    <div
                      key={field.id}
                      className={dynamicFieldsStyles.inputField}
                    >
                      <Label className={dynamicFieldsStyles.label}>
                        {field.columnDisplayName}{" "}
                        {field?.isRequired && (
                          <span className="required">*</span>
                        )}
                      </Label>
                      <InputTextarea
                        id={field.columnName}
                        autoResize
                        disabled={
                          !(
                            recordAction === "Edit" &&
                            author?.email === loginUser &&
                            navigateFrom === "MyRequest"
                          )
                        }
                        value={formData[field.columnName] || ""}
                        onChange={(e) =>
                          handleInputChange(field.columnName, e.target.value)
                        }
                        rows={3}
                      />
                      {errors[field.columnName] && (
                        <span className={dynamicFieldsStyles.errorMsg}>
                          {errors[field.columnName]}
                        </span>
                      )}
                    </div>
                  )
              )}
          </div>
          {recordAction === "Edit" && navigateFrom === "MyApproval" && (
            <div className={dynamicFieldsStyles.approverSection}>
              <Label className={dynamicFieldsStyles.labelHeader}>
                Approvers section
              </Label>
              <Label className={dynamicFieldsStyles.label}>
                Approver Description
              </Label>
              <InputTextarea
                autoResize
                style={{ width: "100%" }}
                value={approvalDetails?.comments}
                onChange={(e) => {
                  getApprovalDetails("comments", e.target?.value || "");
                }}
                rows={3}
              />
            </div>
          )}
          <div className="customDataTableContainer">
            <Label className={dynamicFieldsStyles.labelHeader}>
              Approval history
            </Label>
            <DataTable
              sortField="itemID"
              sortOrder={-1}
              scrollable
              scrollHeight="350px"
              value={approvalHistoryDetails}
              tableStyle={{ width: "100%" }}
              emptyMessage={
                <>
                  <p style={{ textAlign: "center" }}>No Records Found</p>
                </>
              }
            >
              <Column field="stage" header="Stage"></Column>
              <Column
                field="approver"
                header="Name"
                body={(rowdata) => peoplePickerTemplate(rowdata?.approver)}
              ></Column>
              <Column
                field="status"
                header="Action"
                body={renderStatusColumn}
                style={{ width: "10rem" }}
              ></Column>
              <Column
                field="comments"
                header="Comments"
                body={renderCommentsColumn}
              ></Column>
            </DataTable>
          </div>
          <div className={`${dynamicFieldsStyles.sideBarButtonContainer}`}>
            {recordAction === "Edit" && (
              <>
                <WorkflowActionButtons
                  validateForm={validateForm}
                  approvalDetails={approvalDetails}
                  setApprovalDetails={setApprovalDetails}
                  setRequestsSideBarVisible={setDynamicRequestsSideBarVisible}
                  context={context}
                  updatedRecord={formData}
                  requestsHubDetails={requestsDetails}
                  setRequestsHubDetails={setRequestsDetails}
                  itemID={currentRecord.id}
                />
              </>
            )}
            {recordAction === "View" && (
              <>
                <Button
                  icon="pi pi-times"
                  label="Close"
                  className="customCancelButton"
                  onClick={() => handleCancel()}
                />
              </>
            )}
          </div>
        </div>
      </>
    );
  };

  const handleCancel = () => {
    setDynamicRequestsSideBarVisible(false);
    setErrors({});
    setFormData({});
  };

  useEffect(() => {
    setDynamicFields([]);
    setFormData({});
    setErrors({});
    if (currentRecord.CategoryId) {
      getCategorySectionConfigDetails();
    }
  }, [null, currentRecord.CategoryId]);
  useEffect(() => {
    getApprovalHistory();
  }, [null, currentRecord]);
  useEffect(() => {
    setRequestsDashBoardContent((prev: IRightSideBarContents) => ({
      ...prev,
      RequestsDashBoardContent: DynamicRequestsFieldsSideBarContent(),
    }));
  }, [dynamicFields, formData, errors, approvalDetails]);

  useEffect(() => {
    getRequestHubDetails();
    setApprovalDetails({
      parentID: currentRecord.id,
      stage: currentRecord.approvalJson[0].Currentstage,
      approverEmail: loginUser,
      status: "",
      comments: "",
    });
  }, [dynamicFields, sideBarVisible]);

  return <></>;
};

export default RequestsFields;

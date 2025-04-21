//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//CommonService Imports:
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import {
  IPeoplePickerDetails,
  IRightSideBarContents,
  ISectionColumnsConfig,
  IApprovalDetails,
  IApprovalHistoryDetails,
} from "../../../../CommonServices/interface";
import {
  peoplePickerTemplate,
  statusTemplate,
} from "../../../../CommonServices/CommonTemplates";
//primeReact Imports:
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Label } from "office-ui-fabric-react";
import { FileUpload } from "primereact/fileupload";
import { Tag } from "primereact/tag";
import { GiCancel } from "react-icons/gi";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import SignatureCanvas from "react-signature-canvas";
//Styles Imports:
import dynamicFieldsStyles from "./RequestsFields.module.scss";
import "../../../../External/style.css";
import WorkflowActionButtons from "../WorkflowButtons/WorkflowActionButtons";
import attachmentStyles from "../AttachmentUploader/AttachmentUploader.module.scss";
import { sp } from "@pnp/sp";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";

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
  setShowLoader,
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const sigCanvasRefs = useRef([]);
  const serverRelativeUrl = context?._pageContext?._site?.serverRelativeUrl;
  const [dynamicFields, setDynamicFields] = useState<ISectionColumnsConfig[]>(
    []
  );
  const [files, setFiles] = useState([]);
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
    signature: "",
  });
  const [approvalHistoryDetails, setApprovalHistoryDetails] =
    useState<IApprovalHistoryDetails[]>();
  const [personField, setPersonField] = useState({});
  console.log(formData, "formData");
  console.log(personField, "personField");

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
        dynamicFields.map((e) =>
          e?.columnType === "Person"
            ? (tempArr[`${e.columnName}Id`] =
                Number(item[`${e.columnName}Id`]) || null)
            : e?.columnType === "PersonMulti"
            ? (tempArr[`${e.columnName}Id`] = {
                results: item[`${e.columnName}Id`] || [],
              })
            : (tempArr[e.columnName] = item[e.columnName])
        );
        setFormData(tempArr);
        setAuthor({
          id: item.Author.ID,
          name: item.Author.Title,
          email: item.Author.EMail,
        });
        LoadExistingFiles(currentRecord.id);
      })
      .catch((e) => {
        console.log("Get Current Record from RequestHup Details error", e);
      });
  };

  const LoadExistingFiles = async (id) => {
    const requestId = `${id}`;
    sp.web.lists
      .getByTitle(Config.LibraryNames?.AttachmentsLibrary)
      .items.select("*,FileLeafRef,FileRef,FileDirRef")
      .filter(`RequestID eq '${requestId}' and IsDelete eq false`)
      .expand("File")
      .orderBy("Modified", false)
      .get()
      .then((res: any) => {
        let tempData = [];
        if (res?.length) {
          res?.forEach((val: any) => {
            tempData.push({
              name: val?.File?.Name || "",
              ulr: val?.File?.ServerRelativeUrl || "",
              createdDate: val?.Created ? new Date(val?.Created) : null,
            });
          });
        }
        setFiles([...tempData]);
      })
      .catch((err: any) => {
        SPServices.ErrFunction("Get year end gifts", err);
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
            signature: item?.Signature,
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
        {rowData?.comments?.length > 100
          ? `${rowData?.comments?.substring(0, 100)}...`
          : rowData?.comments}
      </div>
    );
  };
  //Render Signature Column:
  const renderSignatureColumn = (rowData: IApprovalHistoryDetails) => {
    return (
      <div>
        {rowData?.signature && (
          <img
            src={
              rowData.signature.startsWith("data:image")
                ? rowData.signature
                : `data:image/png;base64,${rowData.signature}`
            }
            alt="Signature"
            style={{
              width: "100px",
              height: "30px",
            }}
          />
        )}
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
      if (
        field.isRequired &&
        ((!formData[field.columnName]?.toString().trim() &&
          !(
            field?.columnType === "Person" ||
            field?.columnType === "PersonMulti"
          )) ||
          (!formData[`${field.columnName}Id`]?.toString().trim() &&
            field?.columnType === "Person") ||
          (!formData[`${field.columnName}Id`]?.results &&
            field?.columnType === "PersonMulti"))
      ) {
        if (
          field?.columnType === "Person" ||
          field?.columnType === "PersonMulti"
        ) {
          newErrors[
            `${field.columnName}Id`
          ] = `${field.columnDisplayName} is required.`;
        } else {
          newErrors[
            field.columnName
          ] = `${field.columnDisplayName} is required.`;
        }
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

  const getUsers = async (columnName, userIDs: any) => {
    try {
      let tempUserIDs: number[] = [];

      if (Array.isArray(userIDs?.results)) {
        tempUserIDs = userIDs.results;
      } else if (typeof userIDs === "number") {
        tempUserIDs = [userIDs];
      }

      if (tempUserIDs.length > 0) {
        const userDetails = await Promise.all(
          tempUserIDs.map(async (id) => {
            const res = await sp.web.siteUsers.getById(id).get();
            return res?.Email;
          })
        );

        setPersonField((prev) => ({
          ...prev,
          [columnName]: userDetails,
        }));
      } else {
        setPersonField((prev) => ({
          ...prev,
          [columnName]: [],
        }));
      }
    } catch (err) {
      console.log("getUsers error", err);
      setPersonField((prev) => ({
        ...prev,
        [columnName]: [],
      }));
    }
  };

  //Group dynamic fields by section name:
  const groupedFields = dynamicFields.reduce((acc, field) => {
    if (!acc[field.sectionName]) {
      acc[field.sectionName] = [];
    }
    acc[field.sectionName].push(field);
    return acc;
  }, {});

  //Remove file
  const removeFile = async (fileName: string) => {
    try {
      const folderPath = `${serverRelativeUrl}/${Config.LibraryNames?.AttachmentsLibrary}/Requestors`;
      const items = await sp.web.lists
        .getByTitle(Config.LibraryNames?.AttachmentsLibrary)
        .items.filter(`FileLeafRef eq '${fileName}'`)
        .select("Id", "FileLeafRef", "FileRef")
        .get();

      if (items.length > 0) {
        const itemId = items[0].Id;
        await sp.web.lists
          .getByTitle(Config.LibraryNames?.AttachmentsLibrary)
          .items.getById(itemId)
          .update({
            IsDelete: true,
          });
      }
      const updatedFiles = files.filter((file) => file.name !== fileName);
      setFiles(updatedFiles);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  //Clear Signature:
  const clear = () => {
    sigCanvas.current?.clear();
    setApprovalDetails((prev) => ({
      ...prev,
      signature: "",
    }));
  };

  //Handle Signature Change:
  const handleSignatureChange = () => {
    const dataURL: any = sigCanvas.current
      ?.getTrimmedCanvas()
      .toDataURL("image/png");
    setApprovalDetails((prev) => ({
      ...prev,
      signature: dataURL,
    }));
  };

  //DynamicRequestFieldsSideBarContent Return Function:
  const DynamicRequestsFieldsSideBarContent = () => {
    return (
      <>
        <div className={dynamicFieldsStyles.formContainer}>
          <Label className={dynamicFieldsStyles.labelHeader}>
            Request details
          </Label>
          {Object.entries(groupedFields).map(
            ([sectionName, fields]: [string, ISectionColumnsConfig[]]) => (
              <div
                key={sectionName}
                className={dynamicFieldsStyles.formContainer}
              >
                <h3 className="overAllHeading">{sectionName}</h3>
                <div className={dynamicFieldsStyles.singlelineFields}>
                  {fields
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
                              id={field.columnName}
                              value={formData[field.columnName] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  field.columnName,
                                  e.target.value
                                )
                              }
                              disabled={
                                !(
                                  recordAction === "Edit" &&
                                  author?.email === loginUser &&
                                  navigateFrom === "MyRequest"
                                )
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
                  {fields
                    .filter((f) => f.columnType === "Number")
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
                              id={field.columnName}
                              keyfilter="num"
                              value={formData[field.columnName] || null}
                              onChange={(e) =>
                                handleInputChange(
                                  field.columnName,
                                  e.target.value
                                )
                              }
                              disabled={
                                !(
                                  recordAction === "Edit" &&
                                  author?.email === loginUser &&
                                  navigateFrom === "MyRequest"
                                )
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
                  {fields
                    .filter(
                      (f) =>
                        f.columnType === "PersonMulti" ||
                        f.columnType === "Person"
                    )
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
                            <PeoplePicker
                              context={context}
                              personSelectionLimit={
                                field?.columnType === "Person" ? 1 : 5
                              }
                              defaultSelectedUsers={
                                personField[field.columnName] || []
                              }
                              onChange={(e: any) => {
                                field?.columnType === "Person";
                                handleInputChange(
                                  `${field.columnName}Id`,
                                  field?.columnType === "Person"
                                    ? Number(e[0]?.id) || null
                                    : {
                                        results:
                                          e?.map((person) => person?.id) || [],
                                      }
                                );
                              }}
                              disabled={
                                !(
                                  recordAction === "Edit" &&
                                  author?.email === loginUser &&
                                  navigateFrom === "MyRequest"
                                )
                              }
                              groupName={""}
                              showtooltip={true}
                              ensureUser={true}
                              principalTypes={[PrincipalType.User]}
                              resolveDelay={1000}
                            />
                            {errors[`${field.columnName}Id`] && (
                              <span className={dynamicFieldsStyles.errorMsg}>
                                {errors[`${field.columnName}Id`]}
                              </span>
                            )}
                          </div>
                        )
                    )}
                  {fields
                    .filter(
                      (f) =>
                        f.columnType === "Date" || f.columnType === "DateTime"
                    )
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
                            <Calendar
                              id="calendar-12h"
                              value={
                                formData[field.columnName]
                                  ? new Date(formData[field.columnName])
                                  : null
                              }
                              onChange={(e) => {
                                handleInputChange(
                                  field.columnName,
                                  field?.columnType === "DateTime"
                                    ? e?.value.toLocaleString()
                                    : e?.value.toLocaleDateString("en-US")
                                );
                              }}
                              disabled={
                                !(
                                  recordAction === "Edit" &&
                                  author?.email === loginUser &&
                                  navigateFrom === "MyRequest"
                                )
                              }
                              showTime={field?.columnType === "DateTime"}
                              hourFormat="12"
                              dateFormat="dd/mm/yy"
                              showIcon
                            />
                            {errors[field.columnName] && (
                              <span className={dynamicFieldsStyles.errorMsg}>
                                {errors[field.columnName]}
                              </span>
                            )}
                          </div>
                        )
                    )}
                  {fields
                    .filter((f) => f.columnType === "YesorNo")
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
                            <Checkbox
                              onChange={(e) =>
                                handleInputChange(field.columnName, e.checked)
                              }
                              disabled={
                                !(
                                  recordAction === "Edit" &&
                                  author?.email === loginUser &&
                                  navigateFrom === "MyRequest"
                                )
                              }
                              checked={formData[field.columnName]}
                            ></Checkbox>
                            {errors[field.columnName] && (
                              <span className={dynamicFieldsStyles.errorMsg}>
                                {errors[field.columnName]}
                              </span>
                            )}
                          </div>
                        )
                    )}

                  {fields
                    .filter((f) => f.columnType === "Choice")
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
                            <Dropdown
                              value={field?.choices.find(
                                (e) => e === formData[field.columnName]
                              )}
                              showClear
                              options={field?.choices}
                              onChange={(e) => {
                                handleInputChange(field.columnName, e.value);
                              }}
                              filter
                              placeholder={field.columnName}
                              disabled={
                                !(
                                  recordAction === "Edit" &&
                                  author?.email === loginUser &&
                                  navigateFrom === "MyRequest"
                                )
                              }
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
                  {fields
                    .filter((f) => f.columnType === "Multiline")
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
                            <InputTextarea
                              id={field.columnName}
                              autoResize
                              value={formData[field.columnName] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  field.columnName,
                                  e.target.value
                                )
                              }
                              disabled={
                                !(
                                  recordAction === "Edit" &&
                                  author?.email === loginUser &&
                                  navigateFrom === "MyRequest"
                                )
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
              </div>
            )
          )}
          {files.length > 0 && (
            <div>
              <Label className={dynamicFieldsStyles.label}>Attachments</Label>
              <>
                {!(recordAction === "Edit") ? (
                  ""
                ) : (
                  <div>
                    <FileUpload
                      className="addNewButton"
                      name="demo[]"
                      mode="basic"
                      onSelect={(e) => setFiles([...files, ...e.files])}
                      url="/api/upload"
                      auto
                      multiple
                      maxFileSize={1000000}
                      style={{ width: "14%" }}
                      chooseLabel="Browse"
                      chooseOptions={{ icon: "" }}
                    />
                  </div>
                )}
                <div style={{ marginTop: "20px" }}>
                  {files.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {files.map((file, index) => (
                        <li className={attachmentStyles?.fileList} key={index}>
                          <Tag
                            className={attachmentStyles.filNameTag}
                            value={
                              <span
                                onClick={() => downloadFile(file)}
                                style={{
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                              >
                                {file?.name ? file?.name : ""}
                              </span>
                            }
                          />
                          {recordAction === "Edit" && (
                            <GiCancel
                              style={{ cursor: "pointer", color: "red" }}
                              onClick={() => removeFile(file?.name)}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            </div>
          )}
          {recordAction === "Edit" && navigateFrom === "MyApproval" && (
            <>
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
              <div>
                <div className={dynamicFieldsStyles.signatureSection}>
                  <div>
                    <Label className={dynamicFieldsStyles.label}>
                      Sign Below
                    </Label>
                  </div>
                  {approvalDetails?.signature && (
                    <div>
                      <Button
                        label="Clear"
                        className="customCancelButton"
                        style={{
                          padding: "4px 14px",
                          fontSize: "12px",
                        }}
                        onClick={clear}
                      />
                    </div>
                  )}
                </div>
                <div
                  style={{
                    border: "1px solid #16a34a5e",
                    width: "100%",
                    height: "100px",
                  }}
                >
                  <SignatureCanvas
                    penColor="#353862"
                    canvasProps={{
                      width: 680,
                      height: "100px",
                      className: "sigCanvas",
                    }}
                    ref={sigCanvas}
                    onEnd={handleSignatureChange}
                  />
                </div>
              </div>
            </>
          )}

          <div className="customDataTableContainer">
            <Label className={dynamicFieldsStyles.labelHeader}>
              Approval history
            </Label>
            <DataTable
              paginator
              rows={5}
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
              <Column
                field="signature"
                header="Sign"
                body={renderSignatureColumn}
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
                  files={files}
                  setFiles={setFiles}
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

  //DownLoad File Function:
  const downloadFile = (file) => {
    const anchortag = document.createElement("a");
    anchortag.setAttribute("href", file?.ulr);
    anchortag.setAttribute("target", "_blank");
    anchortag.setAttribute("download", "");
    anchortag.click();
    anchortag.remove();
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
    setShowLoader(false);
  }, [dynamicFields, formData, errors, approvalDetails, files, personField]);
  useEffect(() => {
    getRequestHubDetails();
    setApprovalDetails({
      parentID: currentRecord.id,
      stage: currentRecord.approvalJson[0].Currentstage,
      approverEmail: loginUser,
      status: "",
      comments: "",
      signature: "",
    });
  }, [dynamicFields, sideBarVisible]);

  useEffect(() => {
    if (recordAction === "View" && approvalHistoryDetails?.length > 0) {
      approvalHistoryDetails.forEach((item, index) => {
        const signature = item?.signature;
        const canvasRef = sigCanvasRefs.current[index];

        if (signature && canvasRef) {
          const signatureDataUrl = signature.startsWith("data:image")
            ? signature
            : `data:image/png;base64,${signature}`;

          canvasRef.fromDataURL(signatureDataUrl);
          canvasRef.off();
        }
      });
    }
  }, [approvalHistoryDetails]);

  useEffect(() => {
    const fetchDefaultUsers = async () => {
      const personFields: any = Object.values(groupedFields)
        .flat()
        .filter(
          (f: ISectionColumnsConfig) =>
            f.columnType === "Person" || f.columnType === "PersonMulti"
        );

      for (const field of personFields) {
        const columnName = field.columnName;
        const userIdData = formData?.[`${columnName}Id`];
        if (userIdData) {
          await getUsers(columnName, userIdData);
        }
      }
    };

    fetchDefaultUsers();
  }, [formData]);

  return <></>;
};

export default RequestsFields;

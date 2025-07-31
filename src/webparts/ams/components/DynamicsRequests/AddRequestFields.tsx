//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
//CommonService Imports:
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import {
  IRightSideBarContents,
  ISectionColumnsConfig,
  IBasicFilterCategoryDrop,
  IemailMessage,
  IRequestIdFormatWithDigit,
} from "../../../../CommonServices/interface";
import {
  generateRequestID,
  getFileIcon,
  sendNotification,
  toastNotify,
} from "../../../../CommonServices/CommonTemplates";
//primeReact Imports:
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Label } from "office-ui-fabric-react";
import { FileUpload } from "primereact/fileupload";
import { GiCancel } from "react-icons/gi";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import Loader from "../Loader/Loader";
import { sp } from "@pnp/sp/presets/all";
import moment from "moment";
import { Accordion, AccordionTab } from "primereact/accordion";
import { FaCodePullRequest } from "react-icons/fa6";
//Styles Imports:
import dynamicFieldsStyles from "./RequestsFields.module.scss";
import "../../../../External/style.css";
import attachmentStyles from "../AttachmentUploader/AttachmentUploader.module.scss";
import "../../../../External/style.css";

const AddRequestsFields = ({
  categoryFilterValue,
  context,
  setRequestsDashBoardContent,
  setDynamicRequestsSideBarVisible,
}) => {
  const toast = useRef(null);
  const [Ok, setOk] = useState<boolean>(false);
  const serverRelativeUrl = context?._pageContext?._site?.serverRelativeUrl;
  const [files, setFiles] = useState([]);
  const [dynamicFields, setDynamicFields] = useState<ISectionColumnsConfig[]>(
    []
  );
  const clearFiles = useRef(null);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState({});
  const [selectedCategory, setSelectedCategory] =
    useState<IBasicFilterCategoryDrop>();
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [requestIdFormat, setRequestIdFormat] =
    useState<IRequestIdFormatWithDigit>({
      ...Config.requestIdFormatWithDigit,
    });

  //CategorySectionConfig List
  const getCategorySectionConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.CategorySectionConfig,
      Select: "*,Category/Id",
      Expand: "Category",
      Orderby: "ID",
      Orderbydecorasc: false,
      Filter: [
        {
          FilterKey: "CategoryId",
          Operator: "eq",
          FilterValue: selectedCategory?.id.toString(),
        },
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then(async (res: any) => {
        let tempRes = res.sort((a, b) => a.ID - b.ID);
        let allFields: ISectionColumnsConfig[] = [];
        for (const item of tempRes) {
          const sectionFields = await getSectionColumnsConfigDetails(
            item?.SectionName,
            item?.ID
          );
          allFields = [...allFields, ...sectionFields];
        }
        setDynamicFields(allFields);
      })

      .catch((err) => {
        console.log(err, "getCategorySectionConfigDetails");
      });
  };
  //SectionColumnsConfig List
  const getSectionColumnsConfigDetails = async (
    secionName: string,
    secionID: number
  ): Promise<ISectionColumnsConfig[]> => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.SectionColumnsConfig,
        Select: "*,ParentSection/Id",
        Expand: "ParentSection",
        Orderby: "ID",
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
      });
      const tempArr: ISectionColumnsConfig[] = [];
      let tempResColumns = res.sort((a: any, b: any) => a.ID - b.ID);
      tempResColumns.forEach((item: any) => {
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
      return tempArr;
    } catch (e) {
      console.log(e, "getSectionColumnsConfig err");
      return [];
    }
  };

  //Approval Json Config  //Update CategoryID and Approval Json here
  const getapprovalJson = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.ApprovalConfig,
      Select: "*,Category/Id,Category/Category",
      Expand: "Category",
      Filter: [
        {
          FilterKey: "CategoryId",
          Operator: "eq",
          FilterValue: selectedCategory?.id.toString(),
        },
      ],
    })
      .then(async (res: any) => {
        const approvalJson: any = {
          ApprovalFlowName: res[0]?.ApprovalFlowName,
          Currentstage: 1,
          TotalStages: res[0]?.TotalStages,
          RejectionFlow:
            res[0]?.RejectionFlow === "Restart from first stage"
              ? 0
              : res[0]?.RejectionFlow === "Restart from rejected stage"
              ? 1
              : 2,
          stages: await getApprovalStageConfig(res[0]?.ID),
        };
        setFormData({
          ...formData,
          ["ApprovalJson"]: `[${JSON.stringify(approvalJson)}]`,
          ["CategoryId"]: selectedCategory?.id,
        });
        getCategoryConfigDetails(selectedCategory?.id);
      })
      .catch((er) => {
        console.log("getapprovalJson error", er);
      });
  };

  //Get Category Config Details:
  const getCategoryConfigDetails = (categoryID: number) => {
    SPServices.SPReadItemUsingID({
      Listname: Config.ListNames?.CategoryConfig,
      SelectedId: categoryID,
    })
      .then((res: any) => {
        setRequestIdFormat({
          ...requestIdFormat,
          format: res?.RequestIdFormat,
          digit: res?.RequestIdDigits,
        });
      })
      .catch((err) => {
        console.log(err, "getCategoryConfigDetails error");
      });
  };

  //Approval Stage config
  const getApprovalStageConfig = async (parentID) => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.ApprovalStageConfig,
        Select:
          "*,ParentApproval/Id,ParentApproval,Approver/Title,Approver/EMail,Approver/Id",
        Expand: "ParentApproval,Approver",
        Filter: [
          {
            FilterKey: "ParentApprovalId",
            Operator: "eq",
            FilterValue: parentID.toString(),
          },
        ],
      });
      return res.flatMap((Stage: any) => ({
        stage: Stage?.Stage,
        ApprovalType: Stage?.ApprovalProcess,
        approvers: Stage.Approver.map((e) => ({
          id: e.Id,
          name: e.Title,
          email: e.EMail,
          statusCode: 0,
        })),
        stageStatusCode: 0,
      }));
    } catch (err) {
      console.log("getApprovalStageConfig error", err);
      return [];
    }
  };

  //Get email content
  const getEmailContent = async (itemData, emailSubject, emailBody) => {
    const tempApprovalJson = JSON.parse(itemData?.ApprovalJson);

    const tempApprovers: string[] =
      tempApprovalJson[0]?.stages
        ?.find((stage) => stage?.stage === tempApprovalJson[0]?.Currentstage)
        ?.approvers?.map((element: any) => element) || [];

    const authorDetails = await sp.web.siteUsers
      .getById(itemData?.AuthorId)
      .get();
    const replaceDynamicContentArr = {
      "[$RequestID]": `R-${generateRequestID(itemData.ID, 5, 0)}`,
      "[$Requestor]": authorDetails?.Title,
      "[$RequestDate]": moment(itemData?.Created).format("DD-MM-YYYY"),
    };
    tempApprovers.forEach((approver: any) => {
      let finalBody = "";
      replaceDynamicContentArr["[$ToPerson]"] = approver?.name;
      Object.keys(replaceDynamicContentArr).forEach((key) => {
        finalBody = emailBody.replace(/\[\$\w+\]/g, (matched) => {
          return replaceDynamicContentArr[matched] || matched;
        });
      });
      const tempMsgContent: IemailMessage = {
        To: [`${approver?.email}`],
        Subject: emailSubject,
        Body: finalBody,
      };
      sendNotification(tempMsgContent);
    });
  };

  //handleInputChange
  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  //Validate form
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
    if (Object.keys(newErrors).length > 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validation Failed",
        content: (props) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: "Please complete all required fields.",
            image: require("../../../../../src/webparts/ams/assets/giphy.gif"),
          }),
        life: 3000,
      });
      return false;
    }

    return true;
    // return Object.keys(newErrors).length === 0;
  };

  //Remove file :
  const removeFile = (fileName: string) => {
    const updatedFiles = files.filter((file) => file.name !== fileName);
    setFiles(updatedFiles);
  };

  //Submission of form:
  const handleSubmit = async () => {
    if (validateForm()) {
      setShowLoader(true);
      await SPServices.SPAddItem({
        Listname: Config.ListNames.RequestsHub,
        RequestJSON: formData,
      })
        .then(async (e) => {
          try {
            const folderPath = `${serverRelativeUrl}/${Config.LibraryNames?.AttachmentsLibrary}/Requestors`;
            const requestId = `${e?.data?.ID}`;

            for (const file of files) {
              const fileBuffer = await file.arrayBuffer();
              const uploadResult = await sp.web
                .getFolderByServerRelativeUrl(folderPath)
                .files.add(file.name, fileBuffer, true);

              await uploadResult.file.listItemAllFields
                .get()
                .then(async (item) => {
                  await sp.web.lists
                    .getByTitle(Config.LibraryNames?.AttachmentsLibrary)
                    .items.getById(item.Id)
                    .update({
                      RequestID: requestId,
                    });
                });
            }
            setFiles([]);

            const selectedCategoryId = formData?.CategoryId;
            const digitLength = parseInt(requestIdFormat?.digit || "3", 10);

            let count = 0;
            try {
              const categoryCountRes = await SPServices.SPReadItems({
                Listname: Config.ListNames.RequestsHub,
                Filter: [
                  {
                    FilterKey: "CategoryId",
                    Operator: "eq",
                    FilterValue: selectedCategoryId.toString(),
                  },
                ],
                FilterCondition: "and",
                Select: "RequestID",
              });
              const filteredItems = categoryCountRes?.filter(
                (item: any) =>
                  item?.RequestID !== null && item?.RequestID !== ""
              );
              count = filteredItems.length;
            } catch (err) {
              console.error("Error fetching category count:", err);
              count = 0;
            }

            const nextNumber = getFormattedNumber(count, digitLength);
            const generatedRequestId = `${requestIdFormat?.format}-${nextNumber}`;

            await SPServices.SPUpdateItem({
              Listname: Config.ListNames.RequestsHub,
              ID: e.data.ID,
              RequestJSON: {
                RequestID: generatedRequestId,
              },
            });

            await SPServices.SPReadItems({
              Listname: Config.ListNames.CategoryEmailConfig,
              Select: "*,Category/Id,ParentTemplate/Id",
              Expand: "Category,ParentTemplate",
              Filter: [
                {
                  FilterKey: "CategoryId",
                  Operator: "eq",
                  FilterValue: selectedCategoryId.toString(),
                },
                {
                  FilterKey: "Process",
                  Operator: "eq",
                  FilterValue: "Submit",
                },
              ],
              FilterCondition: "and",
            })
              .then((res: any) => {
                res?.forEach((element: any) => {
                  SPServices.SPReadItemUsingID({
                    Listname: Config.ListNames.EmailTemplateConfig,
                    SelectedId: element?.ParentTemplateId,
                    Select: "*",
                  })
                    .then(async (template: any) => {
                      await getEmailContent(
                        e?.data,
                        template?.TemplateName,
                        template?.EmailBody
                      );
                      setDynamicRequestsSideBarVisible(false);
                      setShowLoader(false);
                      setOk(false);
                    })
                    .catch((err) =>
                      console.log("get EmailTemplateConfig error", err)
                    );
                });
              })
              .catch((err) =>
                console.log("get CategoryEmailConfig error", err)
              );
          } catch (error) {
            console.error("Error during file upload or update:", error);
            setShowLoader(false);
          }
        })
        .catch((err) => {
          console.log("Add item in requesthub error", err);
          setShowLoader(false);
        });
    }
  };

  //Final RequestId format:
  const getFormattedNumber = (count: number, digitLength: number): string => {
    const next = count + 1;
    return next.toString().length >= digitLength
      ? next.toString()
      : next.toString().padStart(digitLength, "0");
  };

  //Group dynamic fields by section name:
  const groupedFields = dynamicFields.reduce((acc, field) => {
    if (!acc[field.sectionName]) {
      acc[field.sectionName] = [];
    }
    acc[field.sectionName].push(field);
    return acc;
  }, {});

  //Handle File Selection:
  const handleFileSelection = async (e, files, setFiles, toast, Config) => {
    try {
      const existingSPFiles = await sp.web.lists
        .getByTitle(Config.LibraryNames?.AttachmentsLibrary)
        .items.select("FileLeafRef")
        .filter(`IsDelete eq false`)
        .get();

      const spFileNames = existingSPFiles.map((file) => file.FileLeafRef);

      const duplicatesInSP = e.files.filter((newFile) =>
        spFileNames.includes(newFile.name)
      );

      const duplicatesInState = e.files.filter((newFile) =>
        files.some((existing) => existing.name === newFile.name)
      );

      const totalDuplicates = [...duplicatesInSP, ...duplicatesInState];

      const newFiles = e.files.filter(
        (newFile) =>
          !spFileNames.includes(newFile.name) &&
          !files.some((existing) => existing.name === newFile.name)
      );

      if (totalDuplicates.length > 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Warning",
          content: (prop) =>
            toastNotify({
              iconName: "pi-exclamation-triangle",
              ClsName: "toast-imgcontainer-warning",
              type: "Warning",
              msg: "Some file names already exist!",
              image: require("../../../../../src/webparts/ams/assets/giphy.gif"),
            }),
          life: 3000,
        });
      }

      if (newFiles.length > 0) {
        setFiles([...files, ...newFiles]);
      }
    } catch (error) {
      console.error("Error in file selection:", error);
    }
  };

  //DownLoad File Function:
  const downloadFile = (file) => {
    console.log(file, "file");
    const anchortag = document.createElement("a");
    anchortag.setAttribute("href", file?.objectURL);
    anchortag.setAttribute("target", "_blank");
    anchortag.setAttribute("download", "");
    anchortag.click();
    anchortag.remove();
  };

  //DynamicRequestFieldsSideBarContent Return Function:
  const DynamicRequestsFieldsSideBarContent = () => {
    return (
      <>
        {showLoader ? <Loader /> : ""}
        <div
          style={Ok ? { display: "block", marginTop: "0px" } : {}}
          className={dynamicFieldsStyles.filterHeader}
        >
          <div
            style={Ok ? { width: "100%" } : {}}
            className={dynamicFieldsStyles.filterHeaderContainer}
          >
            <div
              style={
                Ok
                  ? { display: "none" }
                  : { display: "flex", justifyContent: "center" }
              }
            >
              <FaCodePullRequest className={dynamicFieldsStyles.icon} />
            </div>
            <Label
              style={{ textAlign: "center" }}
              className={dynamicFieldsStyles.label}
            >
              <div
                style={
                  Ok
                    ? {
                        justifyContent: "start",
                        marginBottom: "0px",
                        borderBottom: "none",
                        paddingBottom: "0px",
                      }
                    : {
                        justifyContent: "center",
                        marginBottom: "6px",
                        borderBottom: "none",
                        paddingBottom: "0px",
                      }
                }
                className="profile_header_content"
              >
                <div>
                  <span
                    style={{
                      fontSize: "18px",
                      fontFamily: "interSemiBold",
                    }}
                  >
                    Create Request
                  </span>
                </div>
              </div>
            </Label>
            <div
              style={Ok ? { justifyContent: "start" } : {}}
              className={dynamicFieldsStyles.dropDownContainer}
            >
              <Dropdown
                style={{ width: "250px" }}
                value={selectedCategory}
                options={categoryFilterValue.categoryDrop}
                onChange={(e) => {
                  setSelectedCategory(e.value);
                }}
                filter
                optionLabel="name"
                placeholder="Select category"
                className="w-full md:w-14rem inputField"
              />
              {selectedCategory && Ok == false && (
                <div>
                  <Button
                    onClick={() => setOk(true)}
                    style={{ background: "#0aa5ec", color: "white" }}
                    className="modernButton"
                  >
                    Ok
                  </Button>
                </div>
              )}
              {Ok && (
                <div
                  className={`${
                    Ok ? "OkCheckingContainer" : ""
                  } dragAndDropAttachmentContainer`}
                >
                  <FileUpload
                    className="dragAndDropBtn"
                    ref={clearFiles}
                    name="demo[]"
                    onSelect={(e) => {
                      handleFileSelection(e, files, setFiles, toast, Config);
                      clearFiles.current.clear();
                    }}
                    uploadHandler={() => {}}
                    url="/api/upload"
                    multiple
                    maxFileSize={1000000}
                    chooseLabel="File Upload"
                    chooseOptions={{ icon: "pi pi-upload" }}
                    emptyTemplate={
                      <>
                        <div className={attachmentStyles.emptyMessage}>
                          <div
                            className={attachmentStyles.emptyMessageImageDiv}
                          >
                            <img src={require("../../assets/cloud.png")}></img>
                          </div>
                        </div>
                        <span className={attachmentStyles.emptyMessageContent}>
                          Drag or upload your files
                        </span>
                      </>
                    }
                  />
                </div>
              )}
            </div>
            <div>
              {/* <Label className={dynamicFieldsStyles.label}>Attachments</Label> */}
              <>
                {Ok ? (
                  ""
                ) : (
                  <div className="dragAndDropAttachmentContainer">
                    <FileUpload
                      className="dragAndDropBtn"
                      ref={clearFiles}
                      name="demo[]"
                      onSelect={(e) => {
                        handleFileSelection(e, files, setFiles, toast, Config);
                        clearFiles.current.clear();
                      }}
                      uploadHandler={() => {}}
                      url="/api/upload"
                      multiple
                      maxFileSize={1000000}
                      style={{
                        width: "60%",
                        margin: "auto",
                        paddingTop: "10px",
                      }}
                      chooseLabel="File Upload"
                      chooseOptions={{ icon: "pi pi-upload" }}
                      emptyTemplate={
                        <>
                          <div className={attachmentStyles.emptyMessage}>
                            <div
                              className={attachmentStyles.emptyMessageImageDiv}
                            >
                              <img
                                src={require("../../assets/cloud.png")}
                              ></img>
                            </div>
                          </div>
                          <span
                            className={attachmentStyles.emptyMessageContent}
                          >
                            Drag or upload your files
                          </span>
                        </>
                      }
                    />
                  </div>
                )}
                <div
                  style={{
                    height: Ok && files?.length > 6 ? "98px" : Ok ? "auto" : "",
                  }}
                  className={attachmentStyles.filesMasterDiv}
                >
                  {files.length > 0 && (
                    <>
                      <div
                        style={{
                          padding: "4px 0px 0px 0px",
                          textAlign: "start",
                        }}
                        className="allRecords"
                      >
                        <span style={{ fontFamily: "interSemiBold" }}>
                          Selected files
                        </span>
                      </div>
                      <div className={attachmentStyles.filesSection}>
                        {files.map((file, index) => (
                          <div
                            style={Ok ? { width: "16%" } : {}}
                            className={attachmentStyles.filesShowingContainer}
                          >
                            <div className={attachmentStyles.labelContainer}>
                              <div
                                title={file?.name}
                                className={attachmentStyles.fileLabel}
                                onClick={() => downloadFile(file)}
                              >
                                {file?.name.length > 27
                                  ? `${file?.name.slice(0, 27)}...`
                                  : file?.name}
                              </div>
                            </div>
                            <div className={attachmentStyles.cancelIcon}>
                              <GiCancel
                                onClick={() => removeFile(file?.name)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            </div>
          </div>
        </div>
        {Ok && (
          <div
            style={{
              height:
                files?.length > 6
                  ? "410px"
                  : files?.length >= 1
                  ? "450px"
                  : undefined,
            }}
            className={dynamicFieldsStyles.RequestFormContainer}
          >
            {dynamicFields.length > 0 && (
              <>
                <Accordion multiple activeIndex={null}>
                  {Object.entries(groupedFields).map(
                    (
                      [sectionName, fields]: [string, ISectionColumnsConfig[]],
                      idx
                    ) => (
                      <AccordionTab key={idx} header={sectionName}>
                        <div className={dynamicFieldsStyles.formContainer}>
                          <div className={dynamicFieldsStyles.singlelineFields}>
                            {fields
                              .filter((f) => f.columnType === "Singleline")
                              .map((field) => (
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
                                    className="inputField"
                                  />
                                  {errors[field.columnName] && (
                                    <span
                                      className={dynamicFieldsStyles.errorMsg}
                                    >
                                      {errors[field.columnName]}
                                    </span>
                                  )}
                                </div>
                              ))}

                            {fields
                              .filter((f) => f.columnType === "Number")
                              .map((field) => (
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
                                    keyfilter="num"
                                    id={field.columnName}
                                    value={formData[field.columnName] || ""}
                                    onChange={(e) =>
                                      handleInputChange(
                                        field.columnName,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="inputField"
                                  />
                                  {errors[field.columnName] && (
                                    <span
                                      className={dynamicFieldsStyles.errorMsg}
                                    >
                                      {errors[field.columnName]}
                                    </span>
                                  )}
                                </div>
                              ))}

                            {fields
                              .filter((f) => f.columnType === "Choice")
                              .map((field) => (
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
                                    value={formData[field.columnName]}
                                    options={field.choices}
                                    onChange={(e) =>
                                      handleInputChange(
                                        field.columnName,
                                        e.value
                                      )
                                    }
                                    placeholder={field.columnName}
                                    filter
                                    showClear
                                    className="w-full md:w-14rem inputField"
                                  />
                                  {errors[field.columnName] && (
                                    <span
                                      className={dynamicFieldsStyles.errorMsg}
                                    >
                                      {errors[field.columnName]}
                                    </span>
                                  )}
                                </div>
                              ))}

                            {fields
                              .filter((f) => f.columnType === "YesorNo")
                              .map((field) => (
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
                                    checked={formData[field.columnName]}
                                    onChange={(e) =>
                                      handleInputChange(
                                        field.columnName,
                                        e.checked
                                      )
                                    }
                                    style={{ height: "30px", width: "32px" }}
                                  />
                                  {errors[field.columnName] && (
                                    <span
                                      className={dynamicFieldsStyles.errorMsg}
                                    >
                                      {errors[field.columnName]}
                                    </span>
                                  )}
                                </div>
                              ))}

                            {fields
                              .filter(
                                (f) =>
                                  f.columnType === "Person" ||
                                  f.columnType === "PersonMulti"
                              )
                              .map((field) => (
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
                                      field.columnType === "Person" ? 1 : 5
                                    }
                                    defaultSelectedUsers={
                                      field.columnType === "Person"
                                        ? [formData[`${field.columnName}Id`]]
                                        : formData[`${field.columnName}Id`]
                                            ?.results
                                    }
                                    onChange={(e: any) => {
                                      handleInputChange(
                                        `${field.columnName}Id`,
                                        field.columnType === "Person"
                                          ? Number(e[0]?.id) || null
                                          : {
                                              results: e.map(
                                                (person) => person?.id
                                              ),
                                            }
                                      );
                                    }}
                                    showtooltip
                                    tooltipMessage="Search and select persons here"
                                    ensureUser
                                    principalTypes={[PrincipalType.User]}
                                    resolveDelay={1000}
                                  />
                                  {errors[`${field.columnName}Id`] && (
                                    <span
                                      className={dynamicFieldsStyles.errorMsg}
                                    >
                                      {errors[`${field.columnName}Id`]}
                                    </span>
                                  )}
                                </div>
                              ))}

                            {fields
                              .filter(
                                (f) =>
                                  f.columnType === "Date" ||
                                  f.columnType === "DateTime"
                              )
                              .map((field) => (
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
                                    value={
                                      formData[field.columnName]
                                        ? new Date(formData[field.columnName])
                                        : null
                                    }
                                    onChange={(e) =>
                                      handleInputChange(
                                        field.columnName,
                                        field.columnType === "DateTime"
                                          ? e?.value?.toLocaleString()
                                          : e?.value?.toLocaleDateString(
                                              "en-US"
                                            )
                                      )
                                    }
                                    showTime={field.columnType === "DateTime"}
                                    hourFormat="12"
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                    className="inputField"
                                  />
                                  {errors[field.columnName] && (
                                    <span
                                      className={dynamicFieldsStyles.errorMsg}
                                    >
                                      {errors[field.columnName]}
                                    </span>
                                  )}
                                </div>
                              ))}
                          </div>

                          <div className={dynamicFieldsStyles.multilineFields}>
                            {fields
                              .filter((f) => f.columnType === "Multiline")
                              .map((field) => (
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
                                    rows={3}
                                    style={{ height: "80px" }}
                                  />
                                  {errors[field.columnName] && (
                                    <span
                                      className={dynamicFieldsStyles.errorMsg}
                                    >
                                      {errors[field.columnName]}
                                    </span>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      </AccordionTab>
                    )
                  )}
                </Accordion>
              </>
            )}
          </div>
        )}
        {dynamicFields.length > 0 && Ok && (
          <div className={`${dynamicFieldsStyles.sideBarButtonContainer}`}>
            <>
              <Button
                icon="pi pi-times"
                label="Cancel"
                className="customCancelButton"
                onClick={() => handleCancel()}
              />
              <Button
                icon="pi pi-save"
                label="Submit"
                className="customSubmitButton"
                onClick={() => {
                  handleSubmit();
                }}
              />
            </>
          </div>
        )}
      </>
    );
  };

  const handleCancel = () => {
    setDynamicRequestsSideBarVisible(false);
    setErrors({});
    setFormData({});
    setOk(false);
  };

  useEffect(() => {
    setDynamicFields([]);
    setFormData({});
    setErrors({});
    getCategorySectionConfigDetails();
    if (selectedCategory) {
      getapprovalJson();
    }
  }, [null, selectedCategory]);

  useEffect(() => {
    setRequestsDashBoardContent((prev: IRightSideBarContents) => ({
      ...prev,
      AddRequestsDashBoardContent: DynamicRequestsFieldsSideBarContent(),
    }));
  }, [dynamicFields, formData, errors, selectedCategory, files, Ok]);

  return (
    <>
      <Toast ref={toast} />
      {showLoader ? <Loader /> : ""}
    </>
  );
};

export default AddRequestsFields;

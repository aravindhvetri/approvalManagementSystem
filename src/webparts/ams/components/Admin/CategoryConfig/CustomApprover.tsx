//Default Export:
import * as React from "react";
import { useState, useEffect, useImperativeHandle } from "react";
//Prime React Imports:
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Accordion, AccordionTab } from "primereact/accordion";
import { LuPlus } from "react-icons/lu";
import { RiDeleteBinLine } from "react-icons/ri";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { Label } from "office-ui-fabric-react";
//Styles Imports:
import ApprovalWorkFlowStyles from "./CategoryConfig.module.scss";
//Common Service Imports:
import {
  IApprovalDetailsPatch,
  IApprovalFlowValidation,
  IApprovalStages,
  IBasicDropDown,
  IDropdownDetails,
  IFinalSubmitDetails,
  IPeoplePickerDetails,
} from "../../../../../CommonServices/interface";
import { Config } from "../../../../../CommonServices/Config";
import SPServices from "../../../../../CommonServices/SPServices";
import {
  maxFiveMultiplePeoplePickerTemplate,
  multiplePeoplePickerTemplate,
  notesContainerDetails,
  notesContainerDetailsSingleLine,
  peoplePickerTemplate,
} from "../../../../../CommonServices/CommonTemplates";
import { DataTable } from "primereact/datatable";
import { MdAppRegistration } from "react-icons/md";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";

const CustomApprover = ({
  setApproverSignatureDetails,
  approverSignatureDetails,
  categoryClickingID,
  actionBooleans,
  runValidationFunction,
  category,
  context,
  setCustomApproverSideBarVisible,
  setFinalSubmit,
}) => {
  console.log(approverSignatureDetails, "approverSignatureDetails");
  //state Variables:
  const [approvalFlowDetails, setApprovalFlowDetails] =
    useState<IApprovalDetailsPatch>({
      ...Config.ApprovalConfigDefaultDetails,
    });
  console.log(approvalFlowDetails, "approvalFlowDetails");
  console.log(approvalFlowDetails?.stages?.length, "approvalFlowDetailsLength");
  const [validation, setValidation] = useState<IApprovalFlowValidation>({
    ...Config.ApprovalFlowValidation,
  });
  const [rejectionFlowChoice, setRejectionFlowChoice] =
    useState<IDropdownDetails>({
      ...Config.initialConfigDrop,
    });
  const [approvalType, setApprovalType] = useState<IDropdownDetails>({
    ...Config.initialConfigDrop,
  });

  const [activeIndex, setActiveIndex] = useState<any>(0);
  console.log(activeIndex, "activeIndex");
  const [selectedStage, setSelectedStage] = useState({});
  const notes = [
    {
      info: "You can able to edit approval process only on approval workflow",
    },
  ];
  //Get rejectionFlowChoice Choices
  const getRejectionFlowChoices = () => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.ApprovalConfig,
      FieldName: "RejectionFlow",
    })
      .then((res: any) => {
        const temArr: IBasicDropDown[] = [];
        res?.Choices.map((choice) =>
          temArr.push({
            name: choice,
          })
        );
        setRejectionFlowChoice((prev: IDropdownDetails) => ({
          ...prev,
          rejectionFlowDrop: temArr,
        }));
      })
      .catch((err) => {
        console.log("getRejectionFlowChoices error", err);
      });
  };
  // Get Approval Config List Details
  const getApprovalConfigDetails = async () => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.ApprovalConfig,
        Select: "*,Category/Id,Category/Category",
        Expand: "Category",
      });
      return res;
    } catch {
      (err) => console.log("getApprovalConfigDetails err", err);
      return [];
    }
  };

  //onChange handle
  const onChangeHandle = (key, value) => {
    approvalFlowDetails[key] = value;
    setApprovalFlowDetails({ ...approvalFlowDetails });
  };

  //Add stage
  const addStage = () => {
    const tempStage: IApprovalStages[] = approvalFlowDetails?.stages.slice();
    tempStage.push({
      stage: approvalFlowDetails?.stages?.length + 1,
      approvalProcess: null,
      approver: [],
    });
    approvalFlowDetails["stages"] = [...tempStage];
    setApprovalFlowDetails({
      ...approvalFlowDetails,
      totalStages: approvalFlowDetails?.stages?.length,
    });
    setSelectedStage({
      stage: approvalFlowDetails?.stages?.length,
      approvalProcess: null,
      approver: [],
    });
  };

  //Remove stage
  const removeStage = (stageIndex) => {
    var newStages = approvalFlowDetails?.stages?.slice();
    newStages.splice(stageIndex, 1)[0];
    const orderedStage: IApprovalStages[] = [];
    newStages.forEach((e, i) =>
      orderedStage.push({
        stage: i + 1,
        approvalProcess: e?.approvalProcess,
        approver: e?.approver,
      })
    );
    approvalFlowDetails["stages"] = [...orderedStage];
    setApprovalFlowDetails({
      ...approvalFlowDetails,
      totalStages: orderedStage.length,
    });
    setApproverSignatureDetails({
      ...Config.approverSignatureFieldConfig,
    });
    if (selectedStage?.["stage"] === stageIndex + 1) {
      setSelectedStage(
        orderedStage.find(
          (e) => e.stage === (stageIndex === 0 ? 1 : stageIndex)
        )
      );
    }
    setValidation({ ...Config.ApprovalFlowValidation });
  };

  //Update stage
  const updateStage = (
    index: number,
    key: keyof IApprovalStages,
    value: any
  ) => {
    const tempUpdateStage: IApprovalStages[] = [...approvalFlowDetails.stages];
    var keyValue;
    if (tempUpdateStage[index]) {
      if (key === "approver") {
        const tempApproverArr: IPeoplePickerDetails[] = [];
        value.map((e) =>
          tempApproverArr.push({
            id: e?.id,
            name: e?.text,
            email: e?.secondaryText,
          })
        );
        keyValue = [...tempApproverArr];
      } else {
        keyValue = value;
      }
      tempUpdateStage[index] = { ...tempUpdateStage[index], [key]: keyValue }; // Update the specific key
    }
    setApprovalFlowDetails({
      ...approvalFlowDetails,
      stages: tempUpdateStage,
    });
  };

  //Validation
  const validRequiredField = async (action) => {
    const tempApprovalConfigDetailsArr = await getApprovalConfigDetails();

    if (
      approvalFlowDetails?.apprvalFlowName.trim().length === 0 ||
      approvalFlowDetails?.rejectionFlow.trim().length === 0
    ) {
      validation["approvalConfigValidation"] =
        "Workflow name and Rejection process both are required";
    } else if (approvalFlowDetails?.stages.length === 0 && action === "next") {
      validation["approvalConfigValidation"] =
        "Atleast one stage approver is required";
    } else if (
      tempApprovalConfigDetailsArr?.some((e) => {
        const isSameFlowName =
          e?.ApprovalFlowName?.trim() ===
          approvalFlowDetails?.apprvalFlowName?.trim();

        return (
          isSameFlowName && !actionBooleans?.isEdit && !actionBooleans?.isView
        );
      }) &&
      action === "next"
    ) {
      validation["approvalConfigValidation"] =
        "Approval flow name is already exists!";
    } else if (
      (action === "addStage" || action === "next") &&
      approvalFlowDetails?.apprvalFlowName.trim() &&
      approvalFlowDetails?.rejectionFlow.trim()
    ) {
      validation["approvalConfigValidation"] = "";
      if (approvalFlowDetails?.stages.length > 0) {
        const tempSatgeErr = approvalFlowDetails?.stages
          ?.map((e, index) =>
            e.approvalProcess === null || e.approver.length === 0 ? index : -1
          )
          .filter((e) => e !== -1);
        if (tempSatgeErr.length > 0) {
          validation["stageErrIndex"] = [...tempSatgeErr];
          validation["stageValidation"] = "People and type are required";
        } else if (tempSatgeErr.length === 0) {
          validation["stageErrIndex"] = [];
          validation["stageValidation"] = "";
        }
      } else {
        validation["stageErrIndex"] = [];
        validation["stageValidation"] = "";
      }
    }
    await setValidation({ ...validation });
    if (!validation?.approvalConfigValidation && !validation?.stageValidation) {
      if (action === "addStage") {
        addStage();
        return true;
      } else if (action === "next") {
        return true;
      }
    } else {
      if (action === "next") {
        return false;
      }
    }
  };
  //Sent validRequiredField function to parent component
  useImperativeHandle(runValidationFunction, () => ({
    ValidationFunc: () => validRequiredField("next"),
  }));

  //particular categoryID Details:
  const fetchCategoryDetails = async () => {
    try {
      const res: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.ApprovalConfig,
        Select: "*",
        Filter: [
          {
            FilterKey: "Category",
            Operator: "eq",
            FilterValue: categoryClickingID.toString(),
          },
        ],
      });

      if (res.length > 0) {
        const matchedCategory = res[0];
        setApprovalFlowDetails({
          apprvalFlowName: matchedCategory.ApprovalFlowName || "",
          totalStages: matchedCategory.TotalStages || 0,
          rejectionFlow: matchedCategory.RejectionFlow || "",
          stages: await fetchApprovalStages(matchedCategory.ID),
        });
      } else {
        console.warn("No matching category found in ApprovalConfig");
        setApprovalFlowDetails(null);
      }
    } catch (err) {
      console.error("Error fetching category details", err);
    }
  };

  const fetchApprovalStages = async (parentId) => {
    try {
      const res: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.ApprovalStageConfig,
        Select: "*,ParentApproval/Id,Approver/Id,Approver/EMail,Approver/Title",
        Expand: "ParentApproval,Approver",
        Orderby: "Stage",
        Filter: [
          {
            FilterKey: "ParentApprovalId",
            Operator: "eq",
            FilterValue: parentId.toString(),
          },
        ],
      });
      return res?.map((stage, index) => ({
        stage: index + 1,
        approvalProcess: stage?.ApprovalProcess || null,
        approver: stage?.Approver?.map((approver) => ({
          id: approver?.Id,
          name: approver?.Title,
          email: approver?.EMail,
        })),
      }));
    } catch (err) {
      console.error("Error fetching approval stages", err);
      return [];
    }
  };
  //Render Rejection Name:
  const renderRejectionName = (data) => {
    console.log("renderRejectionName data", data);
    return (
      <>
        {data !== null && (
          <div className="categoryName">
            <>
              <div className="categoryNameTag categoryNameAnotherTag">
                {data === 1
                  ? "Anyone can approve"
                  : data === 2
                  ? "Everyone should approve"
                  : ""}
              </div>
            </>
          </div>
        )}
      </>
    );
  };
  //Render Approvers column
  const renderApproversColumn = (rowData) => {
    const approvers: IPeoplePickerDetails[] = rowData?.approver;
    return (
      <div>
        {approvers.length > 1
          ? maxFiveMultiplePeoplePickerTemplate(approvers)
          : peoplePickerTemplate(approvers[0])}
      </div>
    );
  };
  //Stages data table
  const stagesDataTable = () => {
    return (
      <DataTable
        value={approvalFlowDetails?.stages}
        className="custom-card-table"
        selectionMode="single"
        selection={selectedStage}
        scrollable
        scrollHeight="246px"
        onSelectionChange={(e) => {
          e.value && setSelectedStage(e.value);
        }}
        emptyMessage={
          <p className="NoDatas" style={{ textAlign: "center" }}>
            No Records Found
          </p>
        }
      >
        <Column
          body={(rowData, row) => (
            <>
              <div
                className="requestCardStage"
                style={
                  selectedStage?.["stage"] === rowData?.stage
                    ? { backgroundColor: "#f3f3f3bd", borderColor: "#0000005c" }
                    : {}
                }
              >
                <div className="requestCardHeader">
                  <div className="requestId">
                    <h3 className="requestIdTitle" style={{ fontSize: "13px" }}>
                      <MdAppRegistration style={{ fontSize: "18px" }} />
                      {`Stage ${rowData?.stage} approval`}
                    </h3>
                  </div>
                  {rowData?.approvalProcess &&
                    renderRejectionName(rowData?.approvalProcess)}
                </div>
                <div className="requestCardBody">
                  {renderApproversColumn(rowData)}
                </div>
              </div>
              <div style={{ marginBottom: "10px" }}>
                {validation?.stageErrIndex.some(
                  (e) =>
                    e ===
                    approvalFlowDetails?.stages.findIndex(
                      (e) => e.stage === rowData?.stage
                    )
                ) && (
                  <div>
                    <span className="errorMsg">
                      {validation?.stageValidation}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        />
      </DataTable>
    );
  };
  useEffect(() => {
    getRejectionFlowChoices();
    const storedData = sessionStorage.getItem("approvalFlowDetails");
    if (storedData) {
      setApprovalFlowDetails(JSON.parse(storedData));
      let tempSelecetedStage: {} = JSON.parse(storedData)?.["stages"]?.find(
        (e) => e?.stage === 1
      );
      setSelectedStage(tempSelecetedStage);
    } else {
      setApprovalFlowDetails((prev: IApprovalDetailsPatch) => ({
        ...prev,
        stages: [
          {
            stage: 1,
            approvalProcess: null,
            approver: [],
          },
        ],
        totalStages: 1,
      }));
      setSelectedStage({
        stage: 1,
        approvalProcess: null,
        approver: [],
      });
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      "approvalFlowDetails",
      JSON.stringify(approvalFlowDetails)
    );

    setFinalSubmit((prev: IFinalSubmitDetails) => ({
      ...prev,
      categoryConfig: {
        ...prev.categoryConfig,
        category: category,
        customApprover: approvalFlowDetails,
      },
    }));
  }, [approvalFlowDetails]);

  useEffect(() => {
    if (categoryClickingID) {
      fetchCategoryDetails();
    }
  }, [categoryClickingID]);

  return (
    <>
      {actionBooleans?.isEdit && (
        <div>{notesContainerDetails("Info", notes)}</div>
      )}
      <div className={`${ApprovalWorkFlowStyles.topSection}`}>
        <div className={`${ApprovalWorkFlowStyles.nameDiv}`}>
          <Label className={`${ApprovalWorkFlowStyles.label}`}>
            Name<span className="required">*</span>
          </Label>
          <InputText
            disabled={actionBooleans?.isEdit || actionBooleans?.isView}
            value={approvalFlowDetails?.apprvalFlowName}
            onChange={(e) => {
              onChangeHandle("apprvalFlowName", e.target.value);
              setValidation({ ...Config.ApprovalFlowValidation });
            }}
            placeholder="Workflow Name"
            style={{ width: "100%" }}
            className="inputField"
          />
        </div>
        <div className={`${ApprovalWorkFlowStyles.rejectDiv}`}>
          <Label className={`${ApprovalWorkFlowStyles.label}`}>
            Rejection process<span className="required">*</span>
          </Label>
          <Dropdown
            disabled={actionBooleans?.isEdit || actionBooleans?.isView}
            options={rejectionFlowChoice?.rejectionFlowDrop}
            value={rejectionFlowChoice?.rejectionFlowDrop.find(
              (e) => e?.name === approvalFlowDetails?.rejectionFlow
            )}
            optionLabel="name"
            onChange={(e) => {
              onChangeHandle("rejectionFlow", e.value?.name);
              setValidation({ ...Config.ApprovalFlowValidation });
            }}
            placeholder="Select Reject Type"
            style={{ width: "100%" }}
            className="inputField"
          />
        </div>
        <div className={`${ApprovalWorkFlowStyles.addStageButton}`}>
          {approvalFlowDetails?.stages[0]?.approver?.length > 0 &&
            approvalFlowDetails?.stages[0]?.approvalProcess !== null && (
              <Button
                visible={!(actionBooleans?.isEdit || actionBooleans?.isView)}
                icon={<LuPlus className="modernBtnIcon" />}
                className="modernButton"
                label="Add stage"
                onClick={async () => {
                  const isValid = await validRequiredField("addStage");
                  if (isValid) {
                    setActiveIndex(approvalFlowDetails?.stages?.length - 1);
                  }
                }}
              />
            )}
        </div>
      </div>

      <span className="errorMsg">{validation?.approvalConfigValidation}</span>

      <div className="approversAccordion">
        <Accordion
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
        >
          {approvalFlowDetails?.stages?.map((stage, index) => (
            <AccordionTab
              key={index}
              header={
                <div className={ApprovalWorkFlowStyles.stageHeaderWrap}>
                  <div className={ApprovalWorkFlowStyles.stageLeftHeader}>
                    <div>{`Stage ${stage?.stage} approval`}</div>
                  </div>

                  <div className={ApprovalWorkFlowStyles.stageRightHeader}>
                    <div>{renderRejectionName(stage?.approvalProcess)}</div>
                    <div className="requestCardAccordionBody">
                      {renderApproversColumn(stage)}
                    </div>
                    <div>
                      {approvalFlowDetails?.stages.length > 1 &&
                        !(actionBooleans?.isEdit || actionBooleans?.isView) && (
                          <div className="actionIconLayer">
                            <RiDeleteBinLine
                              onClick={() => removeStage(index)}
                            />
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              }
            >
              <div className={`${ApprovalWorkFlowStyles.stageFormContainer}`}>
                <div className={`${ApprovalWorkFlowStyles.deleteStageButton}`}>
                  <Label
                    className={`${ApprovalWorkFlowStyles.stageConfigHeader}`}
                  >
                    {`Stage ${stage?.stage}`}
                  </Label>
                </div>
                <div className={`${ApprovalWorkFlowStyles.stageForm}`}>
                  <div className="accordionPeoplePicker">
                    <Label className={ApprovalWorkFlowStyles.label}>
                      People<span className="required">*</span>
                    </Label>
                    <PeoplePicker
                      context={context}
                      personSelectionLimit={7}
                      groupName={""}
                      showtooltip={true}
                      tooltipMessage="Search and select persons here"
                      disabled={
                        actionBooleans?.isEdit || actionBooleans?.isView
                      }
                      ensureUser={true}
                      defaultSelectedUsers={stage?.approver.map(
                        (approver) => approver.email
                      )}
                      onChange={async (items) => {
                        await updateStage(index, "approver", items);
                        setValidation({ ...Config.ApprovalFlowValidation });
                      }}
                      principalTypes={[PrincipalType.User]}
                      resolveDelay={1000}
                    />
                  </div>
                  <div className="accordionDropDown">
                    <Label className={ApprovalWorkFlowStyles.label}>
                      Type<span className="required">*</span>
                    </Label>
                    <Dropdown
                      width={"100%"}
                      disabled={
                        actionBooleans?.isEdit || actionBooleans?.isView
                      }
                      value={approvalType?.approvalFlowType.find(
                        (e) => e?.id === stage?.approvalProcess
                      )}
                      options={approvalType?.approvalFlowType}
                      optionLabel="name"
                      onChange={async (e) => {
                        await updateStage(
                          index,
                          "approvalProcess",
                          e.value?.id
                        );
                        setValidation({ ...Config.ApprovalFlowValidation });
                      }}
                      placeholder="Select Type of Workflow"
                      style={{ marginTop: "0.5rem" }}
                      className="inputField"
                    />
                  </div>
                  <div>
                    <Label className={`${ApprovalWorkFlowStyles.label}`}>
                      Is approver signature mandatory?
                    </Label>
                    <Checkbox
                      onChange={(e) => {
                        const stageKey = `Stage ${stage?.stage}`;
                        setApproverSignatureDetails((prev) => {
                          const isChecked = e.checked;
                          let updatedViewStages = [...prev.ViewStages];

                          if (isChecked) {
                            if (!updatedViewStages.includes(stageKey)) {
                              updatedViewStages.push(stageKey);
                            }
                          } else {
                            updatedViewStages = updatedViewStages.filter(
                              (s) => s !== stageKey
                            );
                          }

                          return {
                            ...prev,
                            ViewStages: updatedViewStages,
                          };
                        });
                      }}
                      checked={approverSignatureDetails.ViewStages.includes(
                        `Stage ${stage?.stage}`
                      )}
                      disabled={actionBooleans.isView}
                    />
                  </div>
                </div>
                {validation?.stageErrIndex.includes(index) && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <span className="errorMsg">
                      {validation?.stageValidation}
                    </span>
                  </div>
                )}
              </div>
            </AccordionTab>
          ))}
        </Accordion>
      </div>
    </>
  );
};

export default CustomApprover;

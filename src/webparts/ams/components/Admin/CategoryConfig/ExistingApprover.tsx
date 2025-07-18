//Default Export:
import * as React from "react";
import { useState, useEffect } from "react";
//Common Service Imports:
import SPServices from "../../../../../CommonServices/SPServices";
import { Config } from "../../../../../CommonServices/Config";
import {
  IApproverSignatureFeildConfig,
  IFinalSubmitDetails,
  INextStageFromCategorySideBar,
  IPeoplePickerDetails,
} from "../../../../../CommonServices/interface";
//Prime React Imports:
import { Dropdown } from "primereact/dropdown";
import { Accordion, AccordionTab } from "primereact/accordion";
import { FaUsersViewfinder } from "react-icons/fa6";
//Styles Imports:
import ExistingApproverStyles from "./CategoryConfig.module.scss";
import {
  multiplePeoplePickerTemplate,
  peoplePickerTemplate,
} from "../../../../../CommonServices/CommonTemplates";
import { Label } from "office-ui-fabric-react";
import { Checkbox } from "primereact/checkbox";

const ExistingApprover = ({
  setApproverSignatureDetails,
  approverSignatureDetails,
  setExisitingApproverSideBarVisible,
  actionBooleans,
  category,
  setFinalSubmit,
}) => {
  //State Variables:
  const [approvalConfigDetails, setApprovalConfigDetails] = useState<any[]>([]);
  const [approvalFlowOptions, setApprovalFlowOptions] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [selectedFlowID, setSelectedFlowID] = useState<number>(null);
  const [selectedFlowObj, setSelectedFlowObj] = useState<any>({});
  const [approvalStageConfigDetails, setApprovalStageConfigDetails] = useState<
    any[]
  >([]);

  //Initial Render:
  useEffect(() => {
    getApprovalConfigDetails();

    const storedFlow = sessionStorage.getItem("selectedFlow");
    const storedFlowID = sessionStorage.getItem("selectedFlowID");

    if (storedFlow) {
      setSelectedFlow(storedFlow);
    }
    if (storedFlowID) {
      setSelectedFlowID(Number(storedFlowID));
    }
    //Handle ReLoad Browser then clear session Storage:
    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  //Get Approval ConfigDetails:
  const getApprovalConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.ApprovalConfig,
      Orderby: "Modified",
      Orderbydecorasc: false,
      Select: "*,Category/ID",
      Expand: "Category",
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res) => {
        const temApprovalConfigArray = [];
        const tempFlowNames = new Set();
        res.forEach((items: any) => {
          temApprovalConfigArray.push({
            id: items?.ID,
            categoryID: items?.CategoryId,
            approvalFlowName: items?.ApprovalFlowName,
            approvalProcess: items?.ApprovalProcess,
            rejectionFlow: items?.RejectionFlow,
          });
          if (items?.ApprovalFlowName) {
            tempFlowNames.add(items.ApprovalFlowName);
          }
        });
        setApprovalConfigDetails([...temApprovalConfigArray]);
        setApprovalFlowOptions(
          Array.from(tempFlowNames).map((flow) => ({
            label: flow,
            value: flow,
          }))
        );
      })
      .catch((err) => {
        console.log(err, "Get ApprovalConfig Details");
      });
  };

  //Get ApprovalStageConfigDetails Function Render:
  useEffect(() => {
    if (selectedFlowID !== null) {
      getApprovalStageConfigDetails();
      setFinalSubmit((prev: IFinalSubmitDetails) => ({
        ...prev,
        categoryConfig: {
          ...prev.categoryConfig, // Retain existing properties
          category: category,
          ExistingApprover: selectedFlowID,
        },
      }));
    }
  }, [selectedFlowID]);

  //Get approvalStageConfig Details:
  const getApprovalStageConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.ApprovalStageConfig,
      Orderby: "Stage",
      Orderbydecorasc: true,
      Select: "*,Approver/ID,Approver/EMail,Approver/Title",
      Expand: "Approver",
      Filter: [
        {
          FilterKey: "ParentApproval",
          Operator: "eq",
          FilterValue: selectedFlowID.toString(),
        },
      ],
    })
      .then((res) => {
        const tempApprovalStageConfigArr = [];
        res.forEach((items: any) => {
          let approver: IPeoplePickerDetails[] = [];
          if (items?.Approver) {
            items?.Approver.forEach((val) => {
              approver.push({
                id: val?.ID,
                name: val?.Title,
                email: val?.EMail,
              });
            });
          }
          tempApprovalStageConfigArr.push({
            stage: items?.Stage,
            approver,
            approvalProcess: items?.ApprovalProcess,
          });
        });
        setApprovalStageConfigDetails([...tempApprovalStageConfigArr]);
      })
      .catch((err) => {
        console.log(err, "Get ApprovalStageConfig Details");
      });
  };

  const handleFlowChange = (e: any) => {
    const selectedValue = e.value;
    setSelectedFlow(selectedValue);
    sessionStorage.setItem("selectedFlow", selectedValue);
    const selectedItem = approvalConfigDetails.find(
      (item) => item.approvalFlowName === selectedValue
    );

    setSelectedFlowObj(selectedItem ? selectedItem : "");
    setSelectedFlowID(selectedItem ? selectedItem.id : null);
    sessionStorage.setItem(
      "selectedFlowID",
      selectedItem ? selectedItem.id.toString() : ""
    );
  };

  return (
    <>
      <div className={`${ExistingApproverStyles.CategoryContainer}`}>
        <div className={`${ExistingApproverStyles.dropDownDiv}`}>
          <Dropdown
            value={selectedFlow}
            options={approvalFlowOptions}
            onChange={(e) => {
              setApproverSignatureDetails({
                ...Config.approverSignatureFieldConfig,
              });
              handleFlowChange(e);
            }}
            placeholder="Select Approval Flow"
            className={`${ExistingApproverStyles.dropDown}`}
          />
        </div>
        {selectedFlowObj?.rejectionFlow ? (
          <div className={`${ExistingApproverStyles.RejectionDiv}`}>
            {selectedFlowObj?.rejectionFlow}
          </div>
        ) : (
          ""
        )}
      </div>
      <div
        className={`${ExistingApproverStyles.approversContainer} approversAccordion`}
      >
        <Accordion multiple activeIndex={null}>
          {approvalStageConfigDetails
            .sort((a, b) => a.stage - b.stage)
            .map((stageData) => (
              <AccordionTab
                key={stageData.stage}
                header={`Stage ${stageData.stage}`}
              >
                <div
                  key={stageData.stage}
                  className={`${ExistingApproverStyles.stageSection}`}
                >
                  <div>
                    <div className={ExistingApproverStyles.stageHeader}>
                      <div>
                        <FaUsersViewfinder />
                      </div>
                      <div>
                        <h3>Stage {stageData.stage} approvers</h3>
                      </div>
                    </div>
                    <div
                      className={`${ExistingApproverStyles.approvalMessage}`}
                    >
                      {stageData.approvalProcess === 1
                        ? "Anyone can approve"
                        : "Everyone should approve"}
                    </div>
                  </div>
                  <div className={`${ExistingApproverStyles.approversList}`}>
                    <div>
                      <div>
                        <Label className={`${ExistingApproverStyles.label}`}>
                          Is Approver Signature Mandatory?
                        </Label>
                        <Checkbox
                          onChange={(e) => {
                            const stageKey = `Stage ${stageData.stage}`;
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
                            `Stage ${stageData.stage}`
                          )}
                          disabled={actionBooleans.isView}
                        />
                      </div>
                    </div>
                    {stageData?.approver.length > 1
                      ? multiplePeoplePickerTemplate(stageData?.approver)
                      : peoplePickerTemplate(stageData?.approver[0])}
                  </div>
                </div>
              </AccordionTab>
            ))}
        </Accordion>
      </div>
    </>
  );
};

export default ExistingApprover;

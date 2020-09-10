import React, { Component } from "react";
import { Button, Checkbox, Modal, ListView, PullToRefresh } from "antd-mobile";
import { message } from "antd";
import history from "@/router/history";
import { getExaminationRecordList,examinationHandPaper } from "@/fetch/api/subject";
import ScoreFinishModal from "@/components/ScoreFinishModal"; //交卷弹框
import { connect } from "react-redux";
import NoData from "@/components/NoData";
import { bindActionCreators } from "redux";
import {
  ExerciseresultTimes,
  SetTestPaperInfo,
  ResultScores,
} from "@/redux/subject/actions";
const yitongguo = require("@/statics/img/yitongguo@2x.png");
const weitongguo = require("@/statics/img/weitongguo@2x.png");
import "./style.less";
//考试记录页

class ExaminationRecord extends Component {
  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
    });
    this.state = {
      totalPage: "", // 总页数
      dataSource: ds,
      allBillData: [],
      isLoading: true,
      listParams: {
        status: 2,
        type: 0,
        // condition: 0,
        // categoryId: this.props.questionBank.questionInfo.categoryId,
        pageNum: 1,
        pageSize:10,
        subjectId: this.props.questionBank.subjectItemInfo.subjectId,
      },
      listParamss:{
				"op": 2,
				"userPaperId": this.props.questionBank.testPaperInfo.userPaperId,
			},
      handPaperModalFlag: false,
      currentSubjectId: this.props.currentSubjectId,
      testList: [],
    };
  }
  componentWillMount() {
    this.onRefresh()
  }
  getExaminationRecordLists(obj) {
    getExaminationRecordList(obj).then((result) => {
      const { allBillData, listParams, dataSource, pageSize } = this.state;
      const totalPage = Math.ceil(result.data.total /10);
      const data = allBillData.concat(result.data.list);
      if (result.code == 200) {
     
        this.setState({
          testList: result.data.list,
          allBillData:data,
          totalPage,
          pageSize,
          dataSource: dataSource.cloneWithRows(data),
          listParams,
        });
      }
    });
  }
  ///=================================================
  onEndReached = () => {
    const { totalPage, listParams } = this.state;
     if (Number(listParams.pageNum) <Number(totalPage)) {
      listParams.pageNum = listParams.pageNum + 1;
        this.getExaminationRecordLists({ ...listParams });
    } else{
      this.setState({
        isLoading: false,
			});
    }
    
  };

  //刷新
  onRefresh = () => {
		this.setState({ refreshing: true });
    let { listParams } = this.state;
    listParams.pageNum = 1;
    getExaminationRecordList({ ...listParams }).then((result) => {
      const totalPage = Math.ceil(result.data.total / 10);
      if (result.code == 200) {
        this.setState({
          allBillData: result.data.list,
          totalPage,
          refreshing: false,
          dataSource: dataSource.cloneWithRows(result.data.list),  
        });
      }
		});
  };
  renderRow = (rowData, sectionID, rowID) => {
    const { handPaperModalFlag, allBillData } = this.state;
    const item = rowData;
    return (
      <div>
        <div className="examinate-test_list">
        {rowID}
          <div className="item_top">
            {item.type == 1 ? (
              <span>真题</span>
            ) : item.type == 2 ? (
              <span>模拟题</span>
            ) : item.type == 3 ? (
              <span>课后练习</span>
            ) : (
              <span>课后作业</span>
            )}

            <div
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.paperName}
            </div>
          </div>
          <div className="item_middle">
            <div className="item_middle_lefts">
              <span>最近得分:</span>
              {item.status == 2 ? (
                <em>{item.score}分</em>
              ) : item.status == 1 && item.reviewFlag == 0 ? (
                <em>待评分(自评)</em>
              ) : item.status == 1 && item.reviewFlag == 1 ? (
                <em>待评分</em>
              ) : (
                ""
              )}
              {item.passState == 0 &&
              item.beginTime &&
              item.endTime &&
              item.score ? (
                <img src={yitongguo} />
              ) : item.passState == 1 &&
                item.beginTime &&
                item.endTime &&
                item.score ? (
                <img src={weitongguo} />
              ) : (
                ""
              )}
            </div>

            <div className="item_middle_right">
              {(item.surplus || item.limitCount == 0) && item.status == 2 ? (
                <div
                  className="test_btn"
                  onClick={(e) => this.navExaminationDetail(e, item)}
                >
                  查看
                </div>
              ) : item.status == 1 &&
                item.reviewFlag == 1 &&
                (item.surplus != 0 || item.limitCount == 0) ? (
                <div
                  className="test_btns"
                  onClick={(e) => {
                    this.stopJump(e, item);
                  }}
                >
                  查看
                </div>
              ) : item.status == 1 && item.reviewFlag == 0 ? (
                <div
                  className="test_btn"
                  onClick={(e) => {
                    this.selfRating(e, item);
                  }}
                >
                  评分
                </div>
              ) : item.score && item.surplus == 0 ? (
                ""
              ) : item.beginTime && item.status == 0 ? (
                <div
                  className="test_btn"
                  onClick={(e) => {
                    this.continuePaper(e, item);
                  }}
                >
                  继续答卷
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
          <div className="item_bottom">
            <span
              className="total_score"
              style={{ position: "relative", left: "-0.1rem" }}
            >
              考试时间:{item.beginTime}
            </span>
            {/* <div className="total_score">{item.totalScore}</div> */}
            <span
              className="people_num"
              style={{ position: "relative", left: "0.2rem" }}
            >
              已有{item.examNum}人参加
            </span>
          </div>
          {/* 题型弹框 */}
        </div>

        <Modal
          popup
          visible={handPaperModalFlag}
          onClose={this.onClose}
          // animationType="slide-up"
          className={"modal-dialog-middle"}
        >
          <ScoreFinishModal
            onClose={this.onClose}
            handPaperToDetail={this.handPaperToDetail}
          />
        </Modal>
      </div>
    );
  };
  //查看
  navExaminationDetail = (e, item) => {
    e.stopPropagation();
    this.props.ResultScores({});
    this.props.setTestPaperInfo(item);

    history.push("/lib/subject/ExaminationWrongSubjectAnalysis");
  };
  //自评分
  selfRating = (e, item) => {
    e.stopPropagation();
    this.props.setTestPaperInfo(item);
    this.props.ExerciseresultTimes(this.state.testList);
    history.push('/lib/subject/selfassquestion');
  };
  	// 获取答题详情
		examinationHandPaper(obj) {
			examinationHandPaper(obj).then((result) => {
			if (result.code == 200) {
			}
		});
	}
  //继续答卷
  continuePaper = (e, item) => {
    const { listParams,listParamss } = this.state;
    e.stopPropagation();
    this.props.setTestPaperInfo(item);
    if (
      new Date().getTime() >
      new Date(item.beginTime).getTime() + item.duration * 60 * 1000
    ) {
      this.setState({
        handPaperModalFlag: true,
      });
      this.examinationHandPaper(listParamss)
      setTimeout(()=>{
        this.getExaminationRecordList(listParams);
      },500)
     
    } else {
      let time =
        item.duration -
        (
          (new Date().getTime() - new Date(item.beginTime).getTime()) /
          60 /
          1000
        ).toFixed(1);
      this.props.setTestPaperInfo({ ...item, startTime: time });
      history.push(`/lib/subject/examinationDetail`);
    }
  };
  // 关闭弹框
  onClose = () => {
    this.setState({
      handPaperModalFlag: false,
    });
  };
  handPaperToDetail = () => {
    this.setState({
      handPaperModalFlag: false,
    });
  };
  stopJump = (e, item) => {
    e.stopPropagation();
    this.props.setTestPaperInfo(item);
    return;
  };
  render() {
    const { dataSource, allBillData, isLoading } = this.state;
    if (this.state.allBillData.length > 0) {
      return (
        <div>
          <ListView
            data={allBillData}
            dataSource={dataSource}
            renderFooter={this.renderFooter}
            renderRow={this.renderRow}
            style={{ height: "100vh" }}
            // pageSize={10}
            onEndReached={this.onEndReached}
            onEndReachedThreshold={25}
            // initialListSize={10}
            pullToRefresh={
              <PullToRefresh
                refreshing={this.state.refreshing}
                onRefresh={this.onRefresh}
              />
            }
            renderFooter={() => (
              <div style={{ padding: 10, textAlign: "center" }}>
                {this.state.isLoading ? "Loading..." : "到底了"}
              </div>
            )}
          />
        </div>
      );
    }else {
      return <NoData />;
    }
   
  }
}
function mapStateToProps(state) {
  return {
    questionBank: state.subject,
  };
}
function mapDispatchToProps(dispatch) {
  return {
    ExerciseresultTimes: bindActionCreators(ExerciseresultTimes, dispatch),
    setTestPaperInfo: bindActionCreators(SetTestPaperInfo, dispatch),
    ResultScores: bindActionCreators(ResultScores, dispatch),
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(ExaminationRecord);

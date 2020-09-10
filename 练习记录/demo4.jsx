import React, { Component } from "react";
import { Button, Checkbox, ListView, PullToRefresh } from "antd-mobile";
import { getExerciseRecordList } from "@/fetch/api/subject";
import history from "@/router/history";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
  SetPracticePaperInfo,
  SetPracticeResult,
} from "@/redux/subject/actions";
import "./style.less";
import NoData from "@/components/NoData";

//练习记录

class PracticeRecord extends Component {
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
      refreshing: true,
      testList: [],
      listParams: {
        categoryId: this.props.questionBank.questionInfo.categoryId,
        // "lessionType": 1,
        pageNum: 1,
        pageSize: 10,
        subjectId: this.props.questionBank.subjectItemInfo.subjectId,
        // "userId": 1
      },
      //继续做题参数
      // listParamss:{
      // 		"categoryId": 1,
      // 		"exerciseRecordId": 1,
      // 		"subjectId": 1
      // }
    };
  }
  //   //练习记录请求
  //   getExerciseRecordList(obj) {

  //   }
  componentWillMount() {
    this.onRefresh();
  }
  //练习记录接口
  getExerciseRecordList(obj) {
    getExerciseRecordList(obj).then((result) => {
      const { allBillData, listParams, dataSource, pageSize } = this.state;
      const totalPage = Math.ceil(result.data.total / 10);
      const data = allBillData.concat(result.data.list);
      if (result.code == 200) {
        this.setState({
          allBillData: data,
          totalPage,
          pageSize,
          dataSource: dataSource.cloneWithRows(data),
          listParams,
          // isLoading:false,
          // refreshing: false,
        });
        
      }
    });
  }

  onEndReached = () => {
    const { totalPage, listParams } = this.state;
    if (Number(listParams.pageNum) <Number(totalPage)) {
       listParams.pageNum=listParams.pageNum+1;
      this.getExerciseRecordList({ ...listParams });
    } else {
      this.setState({
        isLoading: false
      });
    }
  };

  //刷新
  onRefresh = () => {
    this.setState({ refreshing: true });
    let { listParams, dataSource } = this.state;
    listParams.pageNum = 1;
    getExerciseRecordList({ ...listParams }).then((result) => {
      const totalPage = Math.ceil(result.data.total / 10);
      if (result.code == 200) {
        this.setState({
          allBillData: result.data.list,
          dataSource: dataSource.cloneWithRows(result.data.list),
          totalPage,
          refreshing: false,
        });
      }
    });
  };
  //查看
  practiceAgain = (e, item) => {
    e.stopPropagation();
    this.props.SetPracticeResult({});
    this.props.SetPracticePaperInfo(item);
    history.push("/lib/subject/wrongSubjectAnalysis");
  };
  //继续做题
  continuePractice = (e, item) => {
    e.stopPropagation();
    this.props.SetPracticePaperInfo(item);
    let time = "";
    if (item.isFinishFlag == 0 || item.isFinishFlag == null) {
      time = (
        (new Date().getTime() - new Date(item.beginTime).getTime()) /
        60 /
        1000
      ).toFixed(1);
      this.props.SetPracticePaperInfo({ ...item, startTime: time });
      history.push(`/lib/subject/daily`);
    }
  };
  renderRow = (rowData, sectionID, rowID) => {
    const { handPaperModalFlag, allBillData } = this.state;
    const item = rowData;
    return (
      <div className="practice-test_list" key={rowID}>
        {rowID}
        <div className="item_top">
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.name}
          </div>
        </div>
        {item.endTime == null ? (
          <div className="item_middle">
            <div
              className="test_btn"
              style={{ marginLeft: "6.5rem" }}
              onClick={(e) => this.continuePractice(e, item)}
            >
              继续答题
            </div>
          </div>
        ) : item.chapterDelFlag == true ? (
          <div className="item_middle">
            <div className="item_middle_left">
              <span>答错:</span>
              <em style={{ color: "red" }}>{item.wrongNum}</em>
            </div>
            <div className="item_middle_left">
              <span>未做:</span>
              <em>{item.noAnswer}</em>
            </div>

            <div className="item_middle_left">
              <span>答对:</span>
              <em>{item.rightNum}</em>
            </div>
            {/* <div style={{ width: '2rem' }}></div> */}
            <div
              className="test_btn"
              onClick={(e) => this.practiceAgain(e, item)}
            >
              查看
            </div>
          </div>
        ) : (
          <div className="item_middle">
            <div className="item_middle_left">
              <span>答错:</span>
              <em style={{ color: "red" }}>{item.wrongNum}</em>
            </div>
            <div className="item_middle_left">
              <span>未做:</span>
              <em>{item.noAnswer}</em>
            </div>

            <div className="item_middle_left">
              <span>答对:</span>
              <em>{item.rightNum}</em>
            </div>
            <div
              className="test_btn"
              onClick={(e) => this.practiceAgain(e, item)}
            >
              查看
            </div>
          </div>
        )}
        <div className="item_bottom">
          <span className="time_long">练习时间:{item.beginTime}</span>

          {item.spentTime ? (
            <span>练习用时:{item.spentTime}</span>
          ) : (
            <span>练习用时:</span>
          )}
        </div>
      </div>
    );
  };
  render() {
    const { dataSource, allBillData } = this.state;
    if (this.state.allBillData.length > 0) {
      return (
        <div>
          <ListView
            data={allBillData}
            dataSource={dataSource}
            renderFooter={this.renderFooter}
            renderRow={this.renderRow}
            style={{ height: "100vh" }}
            // pageSize={1}
            onEndReached={this.onEndReached}
            onEndReachedThreshold={100}
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
    } else {
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
    SetPracticePaperInfo: bindActionCreators(SetPracticePaperInfo, dispatch),
    SetPracticeResult: bindActionCreators(SetPracticeResult, dispatch),
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(PracticeRecord);

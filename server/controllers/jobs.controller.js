import { Job } from "../models/Job.js";
import moment from "moment";
import mongoose from "mongoose";
import checkPermissions from "../utils/checkPermissions.js";

// Create Job
const createJob = async (req, res) => {
  const { position, company } = req.body;

  if (!position || !company) {
    return res.status(400).json({
      success: false,
      message: "Please provide all values",
    });
  }

  req.body.createdBy = req.user.userId;

  const job = await Job.create(req.body);

  res.status(200).json({ job });
};

// Delete Job
const deleteJob = async (req, res) => {
  const { id: jobId } = req.params;

  const job = await Job.findOne({ _id: jobId });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: `No job with id ${jobId}`,
    });
  }

  // check permissions -> to prevent different user from deleting other users' jobs if they have their job-ID
  checkPermissions(req.user, job.createdBy);

  await job.deleteOne();
  res.status(200).json({ msg: "success! Job Removed" });
};

// Get all jobs
const getAllJobs = async (req, res) => {
  const { status, jobType, sort, search } = req.query;

  // object that contains the queries that will be provided to mongoDB
  const queryObject = {
    createdBy: req.user.userId,
  };

  // add queries based on condition
  if (status && status !== "all") {
    queryObject.status = status;
  }
  if (jobType && jobType !== "all") {
    queryObject.jobType = jobType;
  }
  if (search) {
    queryObject.position = { $regex: search, $options: "i" }; // to search using regular-expressions NOT exact text
  }

  // NO AWAIT
  let result = Job.find(queryObject);

  // chain sort conditions
  if (sort === "latest") {
    result = result.sort("-createdAt"); // Descending
  }
  if (sort === "oldest") {
    result = result.sort("createdAt"); // Ascending
  }
  if (sort === "a-z") {
    result = result.sort("position"); // Ascending
  }
  if (sort === "z-a") {
    result = result.sort("-position"); // Descending
  }

  // setup pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit; // skipping 10 items each time to display the other 10 in the next page

  result = result.skip(skip).limit(limit);
  const jobs = await result;
  const totalJobs = await Job.countDocuments(queryObject); // instead of using the length as length indicates 10 items here and not all jobs
  const numOfPages = Math.ceil(totalJobs / limit);

  res.status(200).json({ jobs, totalJobs, numOfPages });
};

// Show Stats

// Aggregation pipeline
const showStats = async (req, res) => {
  let stats = await Job.aggregate([
    { $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) } }, // all jobs for one user
    { $group: { _id: "$status", count: { $sum: 1 } } }, // group by job-count for each (job-status) field
  ]);


  // manipulating the stats structure to be more usable
  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count; // Ex: (pending: 34)
    return acc;
  }, {});

  const defaultStats = {
    pending: stats.Pending || 0,
    interview: stats.Interview || 0,
    declined: stats.Declined || 0,
  };

  // data for chart
  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } }, // sort from latest to oldest
    { $limit: 6 },
  ]);
  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      const date = moment()
        .month(month - 1) // as mongoDB uses months(1-12) not (0-11)
        .year(year)
        .format("MMM Y");
      return { date, count };
    })
    .reverse();

  res.status(200).json({ defaultStats, monthlyApplications });
};

// Update Job
const updateJob = async (req, res) => {
  const { id: jobId } = req.params;

  const { company, position } = req.body;

  if (!company || !position) {
    return res.status(400).json({
      success: false,
      message: "Please provide all values",
    });
  }

  const job = await Job.findOne({ _id: jobId });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: `No job with id ${jobId}`,
    });
  }

  checkPermissions(req.user, job.createdBy);

  const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, req.body, {
    new: true,
    runValidators: true, // validate that the data exists
  });

  res.status(200).json({ updatedJob }); // for postman
};

export { createJob, deleteJob, getAllJobs, showStats, updateJob };

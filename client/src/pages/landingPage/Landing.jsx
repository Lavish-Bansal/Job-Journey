import React from "react";
import main from "../../assets/images/landingImage.webp";
import { Wrapper } from "./landing.styles";
import { Logo } from "../../components/index";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <Wrapper>
      <nav>
        <Logo />
      </nav>

      <div className="container page">
        {" "}
        <div className="info">
          <h1>
            Organize your <span>Job Search</span> Journey, All in one place
          </h1>
          <p>Track Your Job Search Process Now!</p>
          <Link to="/register" className="btn btn-hero">
            Login/Register
          </Link>
        </div>
        <img src={main} alt="job hunt" className="img main-img" />
      </div>
    </Wrapper>
  );
};

export default Landing;

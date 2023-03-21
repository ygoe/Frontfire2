/*! frontfire-ui-minimal.js v2.0.0-rc.2 | @license MIT | ygoe.de */
/* iife-params(F, window, document) */
/* iife-args(Frontfire, window, document) */
/* build-dir(build) */
/* no-bundle-suffix */

// Copyright (c) 2022-2023, Yves Goergen, https://ygoe.de
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice, this list of conditions
//   and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice, this list of
//   conditions and the following disclaimer in the documentation and/or other materials provided
//   with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

// Import all modules of the minimal profile
import "./plugins/draggable";
import "./plugins/dropdown";
import "./plugins/form";
import "./plugins/image";
import "./plugins/menu";
import "./plugins/message";
import "./plugins/modal";
import "./plugins/notification";
import "./plugins/offcanvas";
import "./plugins/page";
import "./plugins/resizable";
import "./plugins/selectable";
import "./plugins/sortable";
import "./plugins/table";

F.runAutostart();

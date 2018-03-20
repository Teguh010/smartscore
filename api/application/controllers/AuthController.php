<?php defined('BASEPATH') OR exit('No direct script access allowed');

header('Access-Control-Allow-Origin: *');

class AuthController extends SSController 
{
    private $setting;
    public function __construct()
    {
        parent:: __construct();
        $this->load->model('AuthModel');
        $this->setting = $this->getSetting();
    }

    public function validate()
    {
        $user = $this->input->post('username', true);
        $pass = $this->input->post('password', true);
        $rules = [
            [
                'field' => 'username',
                'label' => 'Username',
                'rules' => 'required'
            ],
            [
                'field' => 'password',
                'label' => 'Password',
                'rules' => 'required'
            ],
            [
                'field' => 'tahun_ajaran',
                'label' => 'Tahun Ajaran',
                'rules' => 'required'
            ]
        ];
        $this->form_validation->set_rules($rules);
        $this->form_validation->set_message('required', '{field} wajib diisi');
        $this->form_validation->set_error_delimiters('', '');
        if($this->form_validation->run() == FALSE)
        {
            $res = [
                'code'  => 0,
                'msg'   => 'Invalid login'
            ];
        }
        else 
        {
            if(AuthModel::isValidUser($user, $pass)) 
            {            
                $token = [
                    'username'      => $user,
                    'tahun_ajaran'  => $this->input->post('tahun_ajaran', true)
                ];
                $encoded = JWT::encode($token, 'user_key');
                $res = [
                    'code'      => 1,
                    'msg'       => 'Login berhasil, mengalihkan halaman...',
                    'cookie'    => $encoded
                ];
            }
            else 
            {
                $res = [
                    'code'  => 0,
                    'msg'   => 'Username atau password yang anda masukkan salah'
                ];
            }
        }        

        echo json_encode($res);
    }
    
    public function logout() 
    {
        delete_cookie('ss_session');
        header('Location: http://'.$this->setting[0]->appUrl.'/');
    }

    public function getSettingJSON()
    {
        echo json_encode($this->getSetting());
    }

    public function setAppUrl($url)
    {
        // update App URL
        $this->db->set('appUrl', $url);
        $this->db->where('appUrl', $this->setting[0]->appUrl);
        $this->db->update('settings');
    }

    private function getSetting()
    {
        return $this->db->get('settings')->result();
    }

    public function getTahunAjaran()
    {
        $res = AuthModel::getTahunAjaran();
        echo json_encode($res);
    }

}